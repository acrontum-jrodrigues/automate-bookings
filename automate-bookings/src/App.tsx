import { useState } from "react";
import "./App.css";
import Instructions from "./components/Instructions";
import logEntries from "./scripts/billing";

const projectsBillings = [
  {
    project: "",
    billing: "",
  },
  {
    project: "DDF_DRY Day Wednesday",
    billing: "Cycle 11",
  },
  {
    project: "NHB_New HUB",
    billing: "Research and Planning",
  },
  {
    project: "SLWA_Stock Locator Web App",
    billing: "May 2023",
  },
  {
    project: "INTE_Acrontum Intern",
    billing: "Development",
  },
  {
    project: "INTE_Acrontum Intern",
    billing: "General",
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
          startDate: new Date(`${startDay}/${startMonth}/${startYear}`)
            .toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
            .replaceAll("/", "."),
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

    meetings.sort((a: any, b: any) => {
      if (a.startDate < b.startDate) {
        return -1;
      }
      if (a.startDate > b.startDate) {
        return 1;
      }
      return 0;
    });

    const script = meetings.map((meeting: any) => {
      const { subject, duration, project, billing, startDate, category } =
        meeting;
      const description = subject;

      return `'${startDate}|${project}|${billing}|${description}|${duration}|${category}'`;
    });

    setScriptInput(script.join(",\n"));
  };

  const executeScript = async () => {
    formatToScript();

    await logEntries(scriptInput.split(",\n"));
  };

  return (
    <>
      <Instructions />
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
            <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
              <button onClick={formatToScript}>Format to script</button>
              <button onClick={executeScript}>Execute script</button>
            </div>
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
