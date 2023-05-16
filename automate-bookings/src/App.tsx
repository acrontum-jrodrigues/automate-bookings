import { useState } from "react";
import "./App.css";

const projectsBillings = [
  {
    project: "",
    billing: "",
  },
  {
    project: "Bespoke Conception",
    billing: "RRMC BNSP Bespoke North Star Project - workshops",
  },
  {
    project: "Recruitment",
    billing: "Recruitment - Data Analyst",
  },
  {
    project: "Aftersales Online System",
    billing: "General",
  },
  {
    project: "Product Development",
    billing: "Gather product ideas",
  },
  {
    project: "Acrontum Intern",
    billing: "Onboarding",
  },
  {
    project: "Acrontum Intern",
    billing: "Internal Systems",
  },
  {
    project: "Acrontum Intern",
    billing: "Information security",
  },
  {
    project: "DRY Day Wednesday",
    billing: "Cycle 7",
  },
  {
    project: "Acrontum Intern",
    billing: "^General",
  },
  {
    project: "Acrontum Intern",
    billing: "Consulting",
  },
];

function App() {
  const [text, setText] = useState("");
  const [meetings, setMeetings] = useState([]);
  const [scriptInput, setScriptInput] = useState("");

  const handleChange = (event: any) => {
    setText(event.target.value);
  };

  const handleSubmit = () => {
    try {
      const result = JSON.parse(text);

      const meetings = result.value.map((meeting: any) => {
        const { subject, start, end } = meeting;
        const startDateTime = new Date(start.dateTime);
        const endDateTime = new Date(end.dateTime);

        const startHour = startDateTime.getHours();
        const startMinute = startDateTime.getMinutes();
        const startDay = startDateTime.getDate();
        const startMonth = startDateTime.getMonth() + 1;
        const startYear = startDateTime.getFullYear();
        const endHour = endDateTime.getHours();
        const endMinute = endDateTime.getMinutes();

        const startString = `${String(startHour).padStart(2, "0")}:${String(
          startMinute
        ).padStart(2, "0")}`;
        const endString = `${String(endHour).padStart(2, "0")}:${String(
          endMinute
        ).padStart(2, "0")}`;

        // Calculate the difference in milliseconds
        const diffInMilliseconds = Math.abs(
          endDateTime.getTime() - startDateTime.getTime()
        );

        // Convert milliseconds to hours and minutes
        const hours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
        const minutes = Math.floor(
          (diffInMilliseconds % (1000 * 60 * 60)) / (1000 * 60)
        );

        // Format the output as HH:mm
        const formattedHours = String(hours).padStart(2, "0");
        const formattedMinutes = String(minutes).padStart(2, "0");

        const duration = `${formattedHours}:${formattedMinutes}`;

        return {
          subject,
          startDate: `${String(startDay).padStart(2, "0")}.${String(
            startMonth
          ).padStart(2, "0")}.${String(startYear).padStart(2, "0")}`,
          start: startString,
          end: endString,
          category: "meeting",
          duration,
        };
      });

      meetings.sort((a: any, b: any) => {
        if (a.startDate < b.startDate) {
          return -1;
        }
        if (a.startDate > b.startDate) {
          return 1;
        }
        return 0;
      });

      setMeetings(meetings);
    } catch (e) {
      alert("Invalid JSON");
      return;
    }
  };

  const assignBilling = (meetingIndex: number, billingOption: any) => {
    const newMeetings = [...meetings];
    (newMeetings[meetingIndex] as any).billing = billingOption.billing;
    (newMeetings[meetingIndex] as any).project = billingOption.project;
    setMeetings(newMeetings);
  };

  const formatToScript = () => {
    // the format is as follows:
    // 'date|project|billing|description|hh:mm|billing-type',
    // eg
    // '31.03.2022|aos|scrum.*showcase|daily|0:15|dev'

    if (meetings.filter((meeting: any) => !meeting.billing).length > 0) {
      alert("Please assign a billing to all meetings");
      return;
    }

    const script = meetings.map((meeting: any) => {
      const { subject, duration, project, billing, startDate } = meeting;
      const description = subject;
      const billingType = "dev";

      return `'${startDate}|${project}|${billing}|${description}|${duration}|${billingType}'`;
    });

    setScriptInput(script.join(",\n"));
  };

  return (
    <>
      <b>Instructions:</b>
      <ol>
        <li>
          Go to{" "}
          <a href="https://developer.microsoft.com/en-us/graph/graph-explorer">
            https://developer.microsoft.com/en-us/graph/graph-explorer
          </a>
        </li>
        <li>Login with your Outlook accoount</li>
        <li>Go to the "Outlook Calendar" section on the left bar</li>
        <li>Click on the first item "GET my events for the next week"</li>
        <li>
          Change the URL on the textbox to this one
          https://graph.microsoft.com/v1.0/me/calendarview?startdatetime=2023-05-03T11:30:35.302Z&enddatetime=2023-05-10T11:30:35.302Z&$select=subject,categories,start,end&$top=100.
          Change the dates for the time interval you want to sync
        </li>
        <li>Copy the JSON result and paste it on the textarea below</li>
        <li>Click on the button to parse</li>
        <li>Check the generated table to confirm everything is good</li>
        <li>Click on the button to format to script</li>
        <li>
          Use the generated strings with the script available{" "}
          <a href="https://confluence.acrontum.de/display/AIS/Accelerate+your+time+billing">
            here
          </a>
        </li>
      </ol>
      <div>
        <textarea
          value={text}
          onChange={handleChange}
          placeholder="Paste your JSON here"
          rows={25}
          cols={70}
        ></textarea>
        <br />
        <button onClick={handleSubmit}>Parse</button>

        {meetings.length > 0 ? (
          <>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Duration</th>
                  <th>Billing</th>
                  <th>Billing Type</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((meeting: any, index) => {
                  return (
                    <tr>
                      <td>{meeting.startDate}</td>
                      <td>{meeting.subject}</td>
                      <td>{meeting.start}</td>
                      <td>{meeting.end}</td>
                      <td>{meeting.duration}</td>
                      <td>
                        <select
                          onChange={(e) =>
                            assignBilling(index, JSON.parse(e.target.value))
                          }
                        >
                          {projectsBillings.map((billingOption) => {
                            return (
                              <option
                                selected={
                                  billingOption.project === meeting.project &&
                                  billingOption.billing === meeting.billing
                                }
                                value={JSON.stringify(billingOption)}
                              >
                                {billingOption.project} -{" "}
                                {billingOption.billing}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td>{meeting.category}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <button onClick={formatToScript}>Format to script</button>
          </>
        ) : (
          <></>
        )}

        <br />

        {scriptInput ? (
          <textarea
            value={scriptInput}
            placeholder="Copy this to your script"
            rows={15}
            cols={70}
          ></textarea>
        ) : (
          <></>
        )}
      </div>
    </>
  );
}

export default App;
