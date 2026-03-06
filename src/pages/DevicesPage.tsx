import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader, StatusBadge } from "@/components/StatusBadge";
import { useDevices } from "@/hooks/useIoTData";
import { createDevice, updateDevice, deleteDevice } from "@/lib/api";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function DevicesPage() {
  const { data: devices, isLoading } = useDevices();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<any>(null);
  const [form, setForm] = useState({ device_name: "", node_number: "", serial_number: "", description: "", location: "" });

  const filtered = devices?.filter((d) =>
    d.device_name.toLowerCase().includes(search.toLowerCase()) ||
    d.serial_number?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditDevice(null);
    setForm({ device_name: "", node_number: "", serial_number: "", description: "", location: "" });
    setDialogOpen(true);
  };

  const openEdit = (d: any) => {
    setEditDevice(d);
    setForm({
      device_name: d.device_name,
      node_number: d.node_number?.toString() || "",
      serial_number: d.serial_number || "",
      description: d.description || "",
      location: d.location || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        device_name: form.device_name,
        node_number: form.node_number ? parseInt(form.node_number) : null,
        serial_number: form.serial_number || null,
        description: form.description || null,
        location: form.location || null,
      };
      if (editDevice) {
        await updateDevice(editDevice.id, payload);
        toast.success("Device updated");
      } else {
        await createDevice(payload);
        toast.success("Device created");
      }
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this device and all its data?")) return;
    try {
      await deleteDevice(id);
      toast.success("Device deleted");
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Devices" description="Manage registered IoT devices">
        <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48 bg-secondary" />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAdd} className="gap-1"><Plus className="w-3 h-3" /> Add Device</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>{editDevice ? "Edit Device" : "Add Device"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Device Name" value={form.device_name} onChange={(e) => setForm({ ...form, device_name: e.target.value })} />
              <Input placeholder="Node Number" value={form.node_number} onChange={(e) => setForm({ ...form, node_number: e.target.value })} />
              <Input placeholder="Serial Number" value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} />
              <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <Button onClick={handleSave} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="card-glow rounded-xl bg-card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Node</th>
              <th>Serial</th>
              <th>Status</th>
              <th>Last Seen</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered?.map((d) => (
              <tr key={d.id}>
                <td>
                  <Link to={`/devices/${d.id}`} className="font-medium hover:text-primary transition-colors">
                    {d.device_name}
                  </Link>
                </td>
                <td>{d.node_number ?? "—"}</td>
                <td className="font-mono text-xs">{d.serial_number}</td>
                <td><StatusBadge lastSeen={d.last_seen} isOnline={d.is_online} /></td>
                <td className="text-xs text-muted-foreground">{d.last_seen ? new Date(d.last_seen).toLocaleString() : "Never"}</td>
                <td>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(d)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)} className="text-destructive"><Trash2 className="w-3 h-3" /></Button>
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
