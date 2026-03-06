import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Device = Tables<"devices">;
export type Sensor = Tables<"sensors">;
export type SensorReading = Tables<"sensor_readings">;

export interface DashboardSummary {
  total_devices: number;
  online_devices: number;
  total_sensors: number;
  readings_today: number;
  devices: Device[];
}

const FUNCTION_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/iot-devices`;

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${FUNCTION_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch("/dashboard/summary");
}

export async function fetchDevices(): Promise<Device[]> {
  const { data, error } = await supabase.from("devices").select("*").order("device_name");
  if (error) throw error;
  return data;
}

export async function fetchDevice(id: string): Promise<Device & { sensors: Sensor[] }> {
  const { data, error } = await supabase.from("devices").select("*, sensors(*)").eq("id", id).single();
  if (error) throw error;
  return data as Device & { sensors: Sensor[] };
}

export async function fetchReadings(
  deviceId: string,
  limit = 500,
  from?: string,
  to?: string
): Promise<SensorReading[]> {
  let query = supabase
    .from("sensor_readings")
    .select("*")
    .eq("device_id", deviceId)
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (from) query = query.gte("timestamp", from);
  if (to) query = query.lte("timestamp", to);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchAllReadings(
  limit = 500,
  from?: string,
  to?: string
): Promise<SensorReading[]> {
  let query = supabase
    .from("sensor_readings")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (from) query = query.gte("timestamp", from);
  if (to) query = query.lte("timestamp", to);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchSensors(): Promise<Sensor[]> {
  const { data, error } = await supabase.from("sensors").select("*").order("sensor_name");
  if (error) throw error;
  return data;
}

export async function createDevice(device: Partial<Device>): Promise<Device> {
  const { data, error } = await supabase.from("devices").insert(device as any).select().single();
  if (error) throw error;
  return data;
}

export async function updateDevice(id: string, updates: Partial<Device>): Promise<Device> {
  const { data, error } = await supabase.from("devices").update(updates as any).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteDevice(id: string): Promise<void> {
  const { error } = await supabase.from("devices").delete().eq("id", id);
  if (error) throw error;
}

export async function createSensor(sensor: Partial<Sensor>): Promise<Sensor> {
  const { data, error } = await supabase.from("sensors").insert(sensor as any).select().single();
  if (error) throw error;
  return data;
}

export async function updateSensor(id: string, updates: Partial<Sensor>): Promise<Sensor> {
  const { data, error } = await supabase.from("sensors").update(updates as any).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSensor(id: string): Promise<void> {
  const { error } = await supabase.from("sensors").delete().eq("id", id);
  if (error) throw error;
}

export function isDeviceOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 2 * 60 * 1000;
}
