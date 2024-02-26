import React, { useState, useEffect, ReactNode } from "react";
import Parallelogram from "./Parallelogram";

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
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          minHeight: "100vh",
          width: "100vw",
          maxWidth: "100vw",
          overflowY: "hidden",
        }}
      >
        <Parallelogram
          angle={-22.4}
          width={"4000px"}
          height="215px"
          style={{
            position: "absolute",
            right: `255px`,
            marginTop: "-100px",
          }}
        />
        <Parallelogram
          angle={-22.4}
          width={"1000px"}
          height="2400px"
          style={{
            position: "absolute",
            right: "-388px",
            top: "200px",
          }}
        />
        <div className="pb-40 pl-40 pr-40">{children}</div>
      </div>
    </div>
  );
};

export default Background;
