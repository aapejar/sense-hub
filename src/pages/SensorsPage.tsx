import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/StatusBadge";
import { useSensors, useDevices } from "@/hooks/useIoTData";
import { createSensor, updateSensor, deleteSensor } from "@/lib/api";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function SensorsPage() {
  const { data: sensors } = useSensors();
  const { data: devices } = useDevices();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSensor, setEditSensor] = useState<any>(null);
  const [form, setForm] = useState({ device_id: "", sensor_name: "", sensor_type: "", unit: "", min_value: "", max_value: "" });

  const deviceMap = new Map(devices?.map((d) => [d.id, d.device_name]));

  const openAdd = () => {
    setEditSensor(null);
    setForm({ device_id: "", sensor_name: "", sensor_type: "", unit: "", min_value: "", max_value: "" });
    setDialogOpen(true);
  };

  const openEdit = (s: any) => {
    setEditSensor(s);
    setForm({
      device_id: s.device_id,
      sensor_name: s.sensor_name,
      sensor_type: s.sensor_type,
      unit: s.unit,
      min_value: s.min_value?.toString() || "",
      max_value: s.max_value?.toString() || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        device_id: form.device_id,
        sensor_name: form.sensor_name,
        sensor_type: form.sensor_type,
        unit: form.unit,
        min_value: form.min_value ? parseFloat(form.min_value) : null,
        max_value: form.max_value ? parseFloat(form.max_value) : null,
      };
      if (editSensor) {
        await updateSensor(editSensor.id, payload);
        toast.success("Sensor updated");
      } else {
        await createSensor(payload);
        toast.success("Sensor created");
      }
      qc.invalidateQueries({ queryKey: ["sensors"] });
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sensor?")) return;
    try {
      await deleteSensor(id);
      toast.success("Sensor deleted");
      qc.invalidateQueries({ queryKey: ["sensors"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Sensors" description="Manage device sensors">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAdd} className="gap-1"><Plus className="w-3 h-3" /> Add Sensor</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>{editSensor ? "Edit Sensor" : "Add Sensor"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={form.device_id} onValueChange={(v) => setForm({ ...form, device_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select Device" /></SelectTrigger>
                <SelectContent>
                  {devices?.map((d) => <SelectItem key={d.id} value={d.id}>{d.device_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Sensor Name" value={form.sensor_name} onChange={(e) => setForm({ ...form, sensor_name: e.target.value })} />
              <Input placeholder="Sensor Type" value={form.sensor_type} onChange={(e) => setForm({ ...form, sensor_type: e.target.value })} />
              <Input placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Min Value" value={form.min_value} onChange={(e) => setForm({ ...form, min_value: e.target.value })} />
                <Input placeholder="Max Value" value={form.max_value} onChange={(e) => setForm({ ...form, max_value: e.target.value })} />
              </div>
              <Button onClick={handleSave} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="card-glow rounded-xl bg-card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Sensor Name</th>
              <th>Device</th>
              <th>Type</th>
              <th>Unit</th>
              <th>Range</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sensors?.map((s) => (
              <tr key={s.id}>
                <td className="font-medium">{s.sensor_name}</td>
                <td>{deviceMap.get(s.device_id) || s.device_id.slice(0, 8)}</td>
                <td>{s.sensor_type}</td>
                <td>{s.unit}</td>
                <td className="text-xs text-muted-foreground">{s.min_value}–{s.max_value}</td>
                <td>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="text-destructive"><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
