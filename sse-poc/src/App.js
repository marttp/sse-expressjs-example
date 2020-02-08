import React, { useState, useEffect } from "react";
import axios from 'axios';
import "./App.css";

export default function App() {
  const [process, setProcess] = useState({});
  const [message, setMessage] = useState({});
  const [listening, setListening] = useState(false);

  const statusMessage = {
    subscribed: "Subscribed",
    unsubscribed: "Unsubscribed"
  };

  // useEffect(() => {
  //   if (!listening && !Object.keys(process).length) {
  //     const events = new EventSource("http://localhost:8000/events");
  //     events.onmessage = event => {
  //       const parsedData = JSON.parse(event.data);
  //       console.log(parsedData);
  //       switch (parsedData.type) {
  //         case "init-connection":
  //           setProcess(parsedData);
  //           break;
  //         case "message":
  //           setMessage(parsedData);
  //           break;
  //       }
  //     };
  //     setListening(true);
  //   }
  // }, [listening, process, message]);

  const subscribe = async () => {
    const status = listening;
    if (!status) {
      const events = new EventSource("http://localhost:8000/events");
      events.onmessage = event => {
        const parsedData = JSON.parse(event.data);
        console.log(event)
        switch (parsedData.type) {
          case "init-connection":
            setProcess(parsedData.processId);
            break;
          case "message":
            setMessage(parsedData.message);
            break;
        }
      };
    } else {
      setProcess({});
      setMessage({});
      await axios.delete(`http://localhost:8000/closes/${process}`)
    }
    setListening(!listening);
  };

  return (
    <div>
      <p>{listening ? statusMessage.subscribed : statusMessage.unsubscribed}</p>
      <p>{JSON.stringify(process)}</p>
      <button onClick={subscribe}>
        {listening ? statusMessage.unsubscribed : statusMessage.subscribed}
      </button>
      <br />
      <p>{JSON.stringify(message)}</p>
    </div>
  );
}
