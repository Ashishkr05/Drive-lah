// src/pages/DevicePage.tsx
import React, { useState, useEffect } from "react";
import DeviceCard from "../components/DeviceCard";

const STORAGE_KEY_DEVICES = "drive_listing_devices_v1";

interface DeviceState {
  id: string;
  deviceType: string;
  serial?: string;
  image?: string; // data URL
  own?: boolean;
}

function loadDevices(): DeviceState[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEVICES);
    if (!raw) return [
      { id: "d1", deviceType: "Primary GPS", serial: "", image: undefined, own: false },
      { id: "d2", deviceType: "Secondary GPS", serial: "", image: undefined, own: false },
    ];
    return JSON.parse(raw) as DeviceState[];
  } catch {
    return [
      { id: "d1", deviceType: "Primary GPS", serial: "", image: undefined, own: false },
      { id: "d2", deviceType: "Secondary GPS", serial: "", image: undefined, own: false },
    ];
  }
}

function saveDevices(devs: DeviceState[]) {
  try {
    localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(devs));
  } catch (e) {
    console.warn(e);
  }
}

const DevicePage: React.FC = () => {
  const [devices, setDevices] = useState<DeviceState[]>(() => loadDevices());

  useEffect(() => {
    saveDevices(devices);
  }, [devices]);

  function handleImageSelect(id: string, file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, image: reader.result as string } : d)));
    };
    reader.readAsDataURL(file);
  }

  function toggleOwn(id: string) {
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, own: !d.own } : d)));
  }

  return (
    <section className="device-wrap">
      <div className="card page-card">
        <div className="card-body">
          <h2 className="section-heading">Device management</h2>
          <p className="sub-note">Add details of the device, if any already installed on your car. If none, then continue to next step.</p>

          <div className="devices-list">
            {devices.map((d) => (
              <DeviceCard
                key={d.id}
                id={d.id}
                deviceType={d.deviceType}
                serialNumber={d.serial}
                imageUrl={d.image}
                onSelectImage={handleImageSelect}
                onToggleOwn={toggleOwn}
                ownDevice={!!d.own}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DevicePage;
