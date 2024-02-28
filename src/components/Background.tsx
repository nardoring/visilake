import React, { useState, useEffect, ReactNode } from "react";
import Parallelogram from "./Parallelogram";
import Navbar from "./Navbar";
import Logo from "./Logo";

type BackgroundProps = {
  children: ReactNode;
};

const Background = ({ children }: BackgroundProps) => {
  return (
    <div
      className="bg-blue"
      style={{
        minHeight: "100vh",
        width: "100vw",
        maxWidth: "100vw",
        position: "relative",
      }}
    >
      <div
        className="grid-container"
        style={{
          overflow: "hidden",
        }}
      >
        <div
          className="bg-white"
          style={{
            position: "relative",
            marginTop: "-100px",
            gridRow: "1",
            gridColumnStart: "1",
            gridColumnEnd: "6",
          }}
        ></div>
        <Parallelogram
          angle={-22.4}
          // angle={0}
          width={"100%"}
          height="215px"
          style={{
            marginTop: "-100px",
            gridRow: "1",
            gridColumnStart: "1",
            gridColumnEnd: "8",
          }}
          transformOrigin="bottom"
        />
        <div
          style={{
            gridRow: "2",

            gridColumnStart: "2",
            gridColumnEnd: "10",
          }}
        >
          <Navbar />
        </div>
        <Logo
          // This is here so that the Navbar gets the correct length for the logo. For allignment the actual displayed logo needs to be out of the bar
          style={{
            width: "285px",
            height: "100px",
            marginRight: "0px",
            gridRow: "2",
            gridColumnEnd: "9",
          }}
        />
        <Parallelogram
          angle={-22.4}
          //angle={0}
          width={"1000px"}
          height="2400px"
          style={{
            position: "relative",
            gridRow: "3",
            gridColumn: "10",
          }}
          transformOrigin="top"
        />
        <div
          style={{
            gridColumnStart: "2",
            gridColumnEnd: "10",
            gridRow: "3",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Background;
