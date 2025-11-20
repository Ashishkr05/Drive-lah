import React from "react";
import DeviceCard from "../components/DeviceCard";

const DevicePage: React.FC = () => {
  const [devices, setDevices] = React.useState<any[]>(
    JSON.parse(localStorage.getItem("devicesDraft") || "null") || [
      { id: "d1", type: "Primary GPS", serial: "", bringingOwn: false, imageData: "" },
    ]
  );

  function handleChange(idx: number, patch: Partial<any>) {
    setDevices((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      localStorage.setItem("devicesDraft", JSON.stringify(next));
      return next;
    });
  }

  function addDevice() {
    setDevices((p) => {
      const next = [...p, { id: `d${p.length + 1}`, type: "Secondary GPS", serial: "", bringingOwn: false }];
      localStorage.setItem("devicesDraft", JSON.stringify(next));
      return next;
    });
  }

  function removeDevice(idx: number) {
    setDevices((p) => {
      const next = p.filter((_, i) => i !== idx);
      localStorage.setItem("devicesDraft", JSON.stringify(next));
      return next;
    });
  }

  return (
    <section style={{ padding: 12 }}>
      <h2 className="section-title">Device management</h2>
      <p className="note">Add any devices installed in your vehicle. Images are stored locally as DataURLs (be mindful of size).</p>

      <div className="device-grid">
        {devices.map((d, i) => (
          <DeviceCard key={d.id} index={i} data={d} onChange={handleChange} onRemove={removeDevice} />
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <button onClick={addDevice} style={{ padding: "10px 14px", borderRadius: 8, background: "#eef6f6", border: "1px solid #dfecec" }}>
          Add device
        </button>
      </div>
    </section>
  );
};

export default DevicePage;
