import React from "react";
import type { OrderStatus } from "@yava/shared";
import { ORDER_STATUS_LABEL } from "@yava/shared";
import { Badge } from "./Badge";

const tone: Record<OrderStatus, "blue" | "yellow" | "green" | "red" | "gray" | "orange"> = {
  pending_payment: "gray", placed: "yellow", accepted: "blue", preparing: "orange", ready: "blue", assigned: "blue",
  picked_up: "blue", on_the_way: "blue", delivered: "green", cancelled: "red",
};
export function StatusPill({ status }: { status: OrderStatus }) {
  return <Badge label={ORDER_STATUS_LABEL[status]} tone={tone[status]} />;
}
