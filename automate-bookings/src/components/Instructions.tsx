const Instructions = () => {
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
          Change the URL on the textbox for the dates you want AND the
          additional fields required (start, end are required for the
          integration). E.g.
          https://graph.microsoft.com/v1.0/me/calendarview?startdatetime=2023-05-03T11:30:35.302Z&enddatetime=2023-05-10T11:30:35.302Z&$select=subject,categories,start,end
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
    </>
  );
};

export default Instructions;
