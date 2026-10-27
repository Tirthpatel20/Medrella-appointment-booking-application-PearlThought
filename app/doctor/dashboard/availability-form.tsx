"use client";

import { useState, useTransition } from "react";
import { CalendarIcon, Clock3 } from "lucide-react";

import { createAvailabilitySlot } from "./actions";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function dateValue(date?: Date) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  if (!value) return "Choose a date";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

const times = Array.from({ length: 96 }, (_, index) => {
  const hour = Math.floor(index / 4);
  const minute = (index % 4) * 15;
  const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const label = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2026, 0, 1, hour, minute)));

  return { value, label };
});

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-3 rounded-xl border-slate-300 px-3 font-normal"
            />
          }
        >
          <CalendarIcon className="h-4 w-4 text-slate-500" />
          <span className={value ? "text-slate-900" : "text-slate-500"}>
            {formatDate(value)}
          </span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={
              value
                ? new Date(`${value}T12:00:00`)
                : undefined
            }
            onSelect={(date) => {
              if (date) {
                onChange(dateValue(date));
                setOpen(false);
              }
            }}
            disabled={(date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return date < today;
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <Select value={value} onValueChange={(next) => next && onChange(next)}>
        <SelectTrigger className="w-full rounded-xl border-slate-300">
          <Clock3 className="mr-2 h-4 w-4 text-slate-500" />
          <SelectValue placeholder="Choose a time" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {times.map((time) => (
            <SelectItem key={time.value} value={time.value}>
              {time.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function toIndiaTimestamp(date: string, time: string) {
  if (!date || !time) return "";
  return `${date}T${time}:00+05:30`;
}

export default function AvailabilityForm() {
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setMessage("");

    if (!startDate || !startTime || !endDate || !endTime) {
      setMessage("Choose a start date, start time, end date, and end time.");
      return;
    }

    const start = new Date(toIndiaTimestamp(startDate, startTime));
    const end = new Date(toIndiaTimestamp(endDate, endTime));

    if (end <= start) {
      setMessage("End time must be after the start time.");
      return;
    }

    if (start <= new Date()) {
      setMessage("Choose a future start time.");
      return;
    }

    formData.set("startTime", toIndiaTimestamp(startDate, startTime));
    formData.set("endTime", toIndiaTimestamp(endDate, endTime));

    startTransition(async () => {
      const result = await createAvailabilitySlot(formData);

      if (result?.error) {
        setMessage(result.error);
        return;
      }

      setMessage(result?.success ?? "Slot created successfully.");
      setStartDate("");
      setStartTime("");
      setEndDate("");
      setEndTime("");
    });
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Add availability
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Choose when patients can book a consultation. All times use IST.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-5 p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <DateField
            label="Start date"
            value={startDate}
            onChange={setStartDate}
          />
          <TimeField
            label="Start time"
            value={startTime}
            onChange={setStartTime}
          />
          <DateField
            label="End date"
            value={endDate}
            onChange={setEndDate}
          />
          <TimeField
            label="End time"
            value={endTime}
            onChange={setEndTime}
          />
        </div>

        <p className="text-xs text-slate-500">
          Slots can span midnight. The end date and time must be after the start.
        </p>

        <Button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-teal-700 px-5 hover:bg-teal-800"
        >
          {isPending ? "Creating slot..." : "Add availability"}
        </Button>

        {message && (
          <p
            role="status"
            className={`text-sm ${
              message.toLowerCase().includes("success")
                ? "text-teal-700"
                : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </section>
  );
}