/* =====================================================================================================================

enter times (or comments) in the times array

the format is as follows:
  'date|project|billing|description|hh:mm|billing-type',
eg
  '31.03.2022|aos|scrum.*showcase|daily|0:15|dev',

Projects and billings use regex lowercase matching, so 'SHOWCASE' would match 'showcase', 'something (ShowCase)', etc.

Typically, you can just type in most or part of the billing name - it will complain if it doesn't find only 1 match.

so in a given day, you might have
  '30.03.2022|aos|scrum.*showcase|daily|0:15|meeting',
  // aos super long meeting 3:00 (just a reminder to fill in later)
  '30.03.2022|aos|ticket.*showcase|[AOSRE-1900] FE: update campaign post to send banner image - review|0:15|dev',
  // ...

If it cannot find a billing, it will prevent sending the others.

If it finds a date other than today, it will ask if it should continue.

===================================================================================================================== */

import {
  Billing,
  BillingInfo,
  BillingType,
  Company,
  MemoizedData,
  Project,
} from "../types";

let memoized: MemoizedData | null = null;
let billingInfo: BillingInfo | undefined;

const skipBilling = (billing: Billing): boolean => {
  if (/disabled="disabled"/.test(billing.option)) {
    return true;
  }
  return false;
};

const getBillingInfo = async (): Promise<BillingInfo> => {
  if (billingInfo) {
    return billingInfo;
  }

  const createForm = await fetch(
    "https://hub.acrontum.de/content/time-capture/create",
    {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      cookie: `XSRF_TOKEN=${document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content")}`,
      referrer: "https://hub.acrontum.de/content/time-capture/create",
      referrerPolicy: "strict-origin-when-cross-origin",
      method: "GET",
      mode: "cors",
      credentials: "include",
    } as RequestInit
  ).then((r) => r.text());
  console.log("createForm", createForm);
  const html = new DOMParser().parseFromString(createForm, "text/html");

  const companies: Company[] = [];
  const projects: Project[] = [];
  const billings: Billing[] = [];
  const billingTypes: BillingType = [
    ...html.querySelectorAll<HTMLOptionElement>("select#type_id option"),
  ].reduce((a, o) => ({ ...a, [o.innerText]: o.value }), {});

  for (const cmpny of [
    ...html.querySelectorAll<HTMLOptionElement>("select#company option"),
  ]) {
    if (!cmpny.value) {
      continue;
    }

    const company: Company = {
      id: cmpny.value,
      name: cmpny.innerText,
      projects: null,
    };

    await fetch(`/content/user/projects/${cmpny.value}`)
      .then((r) => r.json())
      .then(async (projs) => {
        for (const [pid, pname] of Object.entries(projs)) {
          const project: Project = {
            id: pid,
            name: pname as string,
            companyId: company.id,
            billings: null,
          };
          project.billings = await fetch(
            `/content/billings/getBillingsForProject/${pid}`
          )
            .then((r) => r.json())
            .then((data) =>
              data.reduce(
                (billings: any, x: any) =>
                  skipBilling(x)
                    ? billings
                    : [
                        ...billings,
                        { ...x, companyId: company.id, projectId: project.id },
                      ],
                []
              )
            );
          projects.push(project);
          company.projects = project;
          billings.push(...(project.billings ?? []));
        }
      });

    companies.push(company);
  }

  billingInfo = { companies, projects, billings, billingTypes };

  return billingInfo;
};

const send = async (billing: Billing): Promise<void> => {
  const [hour, minute] = billing.duration.split(":");

  const csrfToken = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute("content");

  const formdata = [
    `_token=${csrfToken}`,
    `type_id=${billing.typeId}`,
    `company=${billing.companyId}`,
    `project=${billing.projectId}`,
    `billing=${billing.id}`,
    `date=${billing.date}`,
    `end_date=`,
    `hour=${hour}`,
    `minute=${minute}`,
    `duration=${encodeURIComponent(billing.duration)}`,
    `description=${encodeURIComponent(billing.description)}`,
  ].join("&");

  const payload = {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    referrer: "https://hub.acrontum.de/content/time",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: formdata,
    method: "POST",
    mode: "cors",
    credentials: "include",
  } as RequestInit;

  const res = await fetch(
    "https://hub.acrontum.de/content/time-capture",
    payload
  );
  console.log({ payload, res });
};

const findEntryData = (project: string, billing: string): Billing | null => {
  if (!memoized) {
    memoized = {};
  }
  if (memoized[`${project}|${billing}`]) {
    return memoized[`${project}|${billing}`];
  }

  const projectRegex = new RegExp(project, "i");
  const matchingProjects: Project[] | undefined = billingInfo?.projects.filter(
    (p) => projectRegex.test(p.name)
  );

  if (matchingProjects?.length !== 1) {
    console.error(
      `${
        matchingProjects?.length ? "too many" : "no"
      } project matching ${project} found`,
      billingInfo,
      matchingProjects
    );
    return null;
  }

  const billingRegex = new RegExp(billing, "i");
  const matchingBillings: Billing[] =
    matchingProjects[0].billings?.filter((bill) =>
      billingRegex.test(bill.title)
    ) ?? [];

  if (matchingBillings?.length !== 1) {
    console.error(
      `${
        matchingBillings?.length ? "too many" : "no"
      } billing matching ${billing} found`,
      billingInfo,
      matchingProjects[0],
      matchingBillings
    );
    return null;
  }

  memoized[`${project}|${billing}`] = matchingBillings[0];

  return memoized[`${project}|${billing}`];
};

const logEntries = async (entries: string[]): Promise<void> => {
  const date = new Date();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const invalidEntries = entries.filter((e) => e.split("|").length !== 6);
  if (invalidEntries.length) {
    console.error(invalidEntries);
    return;
  }

  const oldEntries = entries.filter((e) => {
    const [eday, emonth, eyear] = e.split(/[.|]/).map((x) => parseInt(x, 10));

    return eday !== day || emonth !== month || eyear !== year;
  });

  if (oldEntries.length && !confirm("Found non-today date, continue?")) {
    console.warn(oldEntries);
    return;
  }

  await getBillingInfo();

  let allLoggable = true;
  const pendingEntries: Billing[] = [];

  for (const entry of entries) {
    const [date, project, billing, description, duration, type] =
      entry.split("|");

    const billingData = findEntryData(project, billing);
    if (!billingData) {
      console.error(`failed to find entry:\n${entry}`);
      allLoggable = false;
      continue;
    }

    let typeId = "2";
    if (type) {
      const typeRegex = new RegExp(type, "i");
      typeId =
        Object.entries(billingInfo?.billingTypes ?? {}).find(([name, id]) =>
          typeRegex.test(name)
        )?.[1] ?? "2";
    }

    pendingEntries.push({
      ...billingData,
      date,
      description,
      duration,
      typeId,
    });
  }

  if (!allLoggable && !confirm("Some entries were not found, continue?")) {
    return;
  }

  await Promise.all(pendingEntries.map((entry) => send(entry)));
};

export default logEntries;
