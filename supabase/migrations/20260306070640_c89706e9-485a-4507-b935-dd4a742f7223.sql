
-- Create devices table
CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_name TEXT NOT NULL,
  node_number INTEGER,
  serial_number TEXT,
  description TEXT,
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sensors table
CREATE TABLE public.sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  sensor_name TEXT NOT NULL,
  sensor_type TEXT NOT NULL,
  unit TEXT NOT NULL,
  min_value DOUBLE PRECISION,
  max_value DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sensor_readings table
CREATE TABLE public.sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  temperature DOUBLE PRECISION,
  humidity DOUBLE PRECISION,
  wifi_rssi INTEGER,
  status TEXT CHECK (status IN ('online', 'offline')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_sensor_readings_device_id ON public.sensor_readings(device_id);
CREATE INDEX idx_sensor_readings_timestamp ON public.sensor_readings(timestamp);
CREATE INDEX idx_sensor_readings_device_timestamp ON public.sensor_readings(device_id, timestamp);
CREATE INDEX idx_sensors_device_id ON public.sensors(device_id);

-- Enable RLS
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

-- Public read access (IoT dashboard - no auth needed)
CREATE POLICY "Public read devices" ON public.devices FOR SELECT USING (true);
CREATE POLICY "Public read sensors" ON public.sensors FOR SELECT USING (true);
CREATE POLICY "Public read readings" ON public.sensor_readings FOR SELECT USING (true);

-- Allow all operations (IoT system, managed by edge functions)
CREATE POLICY "Allow insert devices" ON public.devices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update devices" ON public.devices FOR UPDATE USING (true);
CREATE POLICY "Allow delete devices" ON public.devices FOR DELETE USING (true);
CREATE POLICY "Allow insert sensors" ON public.sensors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update sensors" ON public.sensors FOR UPDATE USING (true);
CREATE POLICY "Allow delete sensors" ON public.sensors FOR DELETE USING (true);
CREATE POLICY "Allow insert readings" ON public.sensor_readings FOR INSERT WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
