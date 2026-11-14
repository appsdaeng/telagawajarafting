"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * The date and party size the guest picks in the tour page's price panel.
 *
 * Both the panel (date, participants, Check availability) and the availability
 * section further down the page (the option cards) need the same values, and
 * they sit in different columns of the page, so the state lives above them in
 * this provider rather than in either component.
 */
type TourBookingState = {
  date: string;
  setDate: (value: string) => void;
  /** The earliest bookable date; empty until the page runs in the browser. */
  minDate: string;
  adults: number;
  children: number;
  setAdults: (value: number) => void;
  setChildren: (value: number) => void;
  /** True once Check availability has been pressed. */
  showOptions: boolean;
  reveal: () => void;
};

const TourBookingContext = createContext<TourBookingState | null>(null);

/** Tomorrow, as `YYYY-MM-DD`: the earliest date the booking form accepts. */
export function tomorrowDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function TourBookingProvider({ children: content }: { children: ReactNode }) {
  // Empty on the server: the tour pages are prerendered, and reading today's
  // date during that prerender is exactly what Next.js rejects. The effect
  // fills both in on the first visit in the browser.
  const [date, setDate] = useState("");
  const [minDate, setMinDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    const tomorrow = tomorrowDate();
    setMinDate(tomorrow);
    setDate((current) => current || tomorrow);
  }, []);

  const reveal = () => {
    setShowOptions(true);

    // The section only exists after this render, so scroll on the next frame.
    requestAnimationFrame(() => {
      document.getElementById("availability")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <TourBookingContext.Provider
      value={{
        date,
        setDate,
        minDate,
        adults,
        children,
        setAdults: (value) => setAdults(Math.min(20, Math.max(1, value))),
        setChildren: (value) => setChildren(Math.min(20, Math.max(0, value))),
        showOptions,
        reveal,
      }}
    >
      {content}
    </TourBookingContext.Provider>
  );
}

export function useTourBooking(): TourBookingState {
  const state = useContext(TourBookingContext);

  if (!state) {
    throw new Error("useTourBooking must be used inside TourBookingProvider");
  }

  return state;
}
