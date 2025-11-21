// src/pages/DevicePage.tsx
import React, { useEffect, useState, useCallback } from "react";
import LeftSteps from "../components/LeftSteps";
import MobileDropdown from "../components/MobileDropdown";
import DeviceCard from "../components/DeviceCard"; // existing component you mentioned
import type { DeviceState as DeviceStateType } from "./types"; // optional, if you keep types elsewhere

type OnNavigateFn = (target: "subscription" | "device" | "easy-access") => void;

const STORAGE_KEY_DEVICES = "drive_listing_devices_v1";

export type DeviceState = {
  id: string;
  deviceType: string;
  serial?: string;
  image?: string | null; // data URL
  own?: boolean;
};

interface Props {
  onNavigate?: OnNavigateFn;
}

function defaultDevices(): DeviceState[] {
  return [
    { id: "d1", deviceType: "Primary GPS", serial: "", image: null, own: false },
    { id: "d2", deviceType: "Secondary GPS", serial: "", image: null, own: false },
  ];
}

function loadDevices(): DeviceState[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEVICES);
    if (!raw) return defaultDevices();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultDevices();
    return parsed.map((p: any, idx: number) => ({
      id: String(p.id ?? `d${idx + 1}`),
      deviceType: String(p.deviceType ?? (idx === 0 ? "Primary GPS" : "Secondary GPS")),
      serial: typeof p.serial === "string" ? p.serial : "",
      image: p.image ?? null,
      own: !!p.own,
    }));
  } catch {
    return defaultDevices();
  }
}

function saveDevices(devs: DeviceState[]) {
  try {
    localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(devs));
  } catch {
    /* ignore storage errors */
  }
}

const DevicePage: React.FC<Props> = ({ onNavigate }) => {
  const [devices, setDevices] = useState<DeviceState[]>(() => loadDevices());

  // persist whenever devices change
  useEffect(() => {
    saveDevices(devices);
  }, [devices]);

  // handlers
  const handleSerialChange = useCallback((id: string, value: string) => {
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, serial: value } : d)));
  }, []);

  const handleToggleOwn = useCallback((id: string) => {
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, own: !d.own } : d)));
  }, []);

  const handleImageSelect = useCallback((id: string, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, image: dataUrl } : d)));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleClearImage = useCallback((id: string) => {
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, image: null } : d)));
  }, []);

  // Next CTA: persist (already persisted on change) and navigate via prop
  const handleNext = useCallback(() => {
    // ensure latest saved
    saveDevices(devices);
    if (typeof onNavigate === "function") onNavigate("easy-access");
  }, [devices, onNavigate]);

  // Render device rows - we reuse classnames from subscription layout to keep pixel parity
  return (
    <section className="subscription-wrap device-wrap" aria-labelledby="device-heading">
      {/* Left steps — same completed list as subscription to show ticks on sidebar */}
      <LeftSteps
        active="Device"
        completed={[
          "Location",
          "About",
          "Features",
          "Rules",
          "Pricing",
          "Promotion",
          "Pictures",
          "Insurance",
          "Subscription",
        ]}
      />

      <div className="right-content">
        {/* mobile dropdown shows "Subscription" in subscription page; for device page show "Device" */}
        <MobileDropdown value="Device" onOpen={() => {}} />

        <div className="card page-card" role="region" aria-labelledby="device-heading">
          <div className="card-body">
            <h2 id="device-heading" className="section-heading">Device management</h2>
            <p className="sub-note">
              Add details of the device, if any already installed on your car. If none, then continue to next step.
            </p>

            <div className="devices-list">
              {devices.map((d, idx) => (
                <div key={d.id} className="device-entry card" style={{ marginBottom: 16 }}>
                  <div className="card-body">
                    <h4 className="small-heading" style={{ marginTop: 0 }}>{`Device ${idx + 1}`}</h4>

                    <div className="device-grid" style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "12px 18px", alignItems: "center" }}>
                      <div className="device-label">Device type</div>
                      <div className="device-value" style={{ fontWeight: 600, color: "#0b6b6b" }}>{d.deviceType}</div>

                      <div className="device-label">Serial number</div>
                      <div className="device-value">
                        <input
                          type="text"
                          className="serial-input"
                          placeholder="Enter the serial number of the device"
                          value={d.serial ?? ""}
                          onChange={(e) => handleSerialChange(d.id, e.target.value)}
                        />
                      </div>

                      <div className="device-label">Bringing your own device?</div>
                      <div className="device-value">
                        <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <input
                            type="checkbox"
                            checked={!!d.own}
                            onChange={() => handleToggleOwn(d.id)}
                            aria-label={`Bringing your own device for ${d.deviceType}`}
                          />
                          <span style={{ fontSize: 13, color: "#556" }}>
                            Toggle this on if you're bringing your own device. Leave it off if Drive mate is to provide the device.
                          </span>
                        </label>
                      </div>

                      <div className="device-label">Upload image</div>
                      <div className="device-value">
                        {d.image ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <img src={d.image} alt={`Device ${idx + 1}`} style={{ maxWidth: 200, maxHeight: 140, borderRadius: 6, border: "1px solid #eee" }} />
                            <div>
                              <button type="button" className="btn small" onClick={() => handleClearImage(d.id)}>Remove</button>
                            </div>
                          </div>
                        ) : (
                          <label className="upload-placeholder" style={{ display: "inline-block", border: "1px dashed #e6e6e6", padding: 12, borderRadius: 6, cursor: "pointer" }}>
                            <div style={{ color: "#0b6b6b", fontWeight: 600 }}>Click to upload</div>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={(e) => {
                                const f = e.target.files && e.target.files[0];
                                handleImageSelect(d.id, f ?? undefined);
                                if (e.target) (e.target as HTMLInputElement).value = "";
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Desktop CTA - reuses same classes so it looks identical to subscription page */}
        <div className="desktop-cta">
          <button
            className="btn next-btn-desktop"
            type="button"
            onClick={handleNext}
            aria-label="Next"
          >
            Next
          </button>
        </div>

        {/* Mobile bottom CTA */}
        <div className="bottom-cta-mobile" aria-hidden={false}>
          <button
            className="btn desktop-hidden next-btn-mobile"
            type="button"
            onClick={handleNext}
            aria-label="Next"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
};

export default DevicePage;
