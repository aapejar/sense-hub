import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboardSummary,
  fetchDevices,
  fetchDevice,
  fetchReadings,
  fetchAllReadings,
  fetchSensors,
} from "@/lib/api";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: fetchDashboardSummary,
    refetchInterval: 10000,
  });
}

export function useDevices() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: fetchDevices,
    refetchInterval: 15000,
  });
}

export function useDevice(id: string) {
  return useQuery({
    queryKey: ["device", id],
    queryFn: () => fetchDevice(id),
    refetchInterval: 10000,
    enabled: !!id,
  });
}

export function useDeviceReadings(deviceId: string, limit = 500, from?: string, to?: string) {
  return useQuery({
    queryKey: ["readings", deviceId, limit, from, to],
    queryFn: () => fetchReadings(deviceId, limit, from, to),
    refetchInterval: 10000,
    enabled: !!deviceId,
  });
}

export function useAllReadings(limit = 500, from?: string) {
  return useQuery({
    queryKey: ["all-readings", limit, from],
    queryFn: () => fetchAllReadings(limit, from),
    refetchInterval: 10000,
  });
}

export function useSensors() {
  return useQuery({
    queryKey: ["sensors"],
    queryFn: fetchSensors,
    refetchInterval: 30000,
  });
}
