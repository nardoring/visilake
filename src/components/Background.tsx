import React, { useState, useEffect, ReactNode } from "react";
import Parallelogram from "./Parallelogram";
import Navbar from "./Navbar";

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
      <div className="">
        <Parallelogram
          angle={-22.4}
          width={"80vw"}
          height="215px"
          style={{
            position: "relative",
            marginTop: "-100px",
          }}
        />
        <div>
          <div
            style={{
              paddingLeft: "10vw",
              paddingRight: "10vw",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Navbar />
            <Parallelogram
              angle={-22.4}
              width={"1000px"}
              height="2400px"
              style={{
                position: "absolute",
                right: "-388px",
              }}
            />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Background;
