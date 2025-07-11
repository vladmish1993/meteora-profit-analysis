import { RangeValue } from "@nextui-org/react";
import {
  CalendarDate,
  getLocalTimeZone,
  parseDate
} from "@internationalized/date";
import { useState } from "react";

export const PositionDateRangePicker = (props: {
  hidden?: boolean;
  start: Date;
  end: Date;
  onFilter: (start: Date, end: Date) => any;
}) => {
  const dateRange = {
    start: parseDate(props.start.toISOString().substring(0, 10)),
    end: parseDate(props.end.toISOString().substring(0, 10))
  } as RangeValue<CalendarDate>;

  const today = {
    start: parseDate(new Date(Date.now()).toISOString().substring(0, 10)),
    end: parseDate(
      new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().substring(0, 10)
    )
  };

  const last7Days = {
    start: parseDate(
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
        .toISOString()
        .substring(0, 10)
    ),
    end: parseDate(
      new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().substring(0, 10)
    )
  };

  const last30Days = {
    start: parseDate(
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
        .toISOString()
        .substring(0, 10)
    ),
    end: parseDate(
      new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().substring(0, 10)
    )
  };

  const [showCalendar, setShowCalendar] = useState(false);

  if (props.hidden) {
    return <></>;
  }

  function updateDates(range: RangeValue<CalendarDate>, closeCalendar = false) {
    if (range && range.end && range.start) {
      const start = range.start.toDate(getLocalTimeZone());
      const end = range.end.toDate(getLocalTimeZone());

      props.onFilter(start, end);
      if (closeCalendar) {
        setShowCalendar(false);
      }
    }
  }

  return <div className="mr-4 my-4 max-w-sm whitespace-nowrap col-span-2" />;
};
