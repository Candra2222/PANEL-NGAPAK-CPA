"use client";

import { createContext } from "react";

export const MonitorCtx = createContext({
  currency: "USD",
  setCurrency: () => {},
  view: "realtime",
  setView: () => {},
  overview: null,
  refreshOverview: () => {},
  range: "today",
  setRange: () => {},
  reportFrom: null,
  setReportFrom: () => {},
  reportTo: null,
  setReportTo: () => {},
});
