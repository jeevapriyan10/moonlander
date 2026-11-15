"use client";

import React from "react";
import { Explain, type ExplainProps } from "./Explain";

export interface TermProps extends ExplainProps {}

export const Term: React.FC<TermProps> = (props) => {
  return <Explain {...props} />;
};
