// src/pages/DevicePage.tsx
import React, { useEffect, useState, useCallback } from "react";
import LeftSteps from "../components/LeftSteps";
import MobileDropdown from "../components/MobileDropdown";

const STORAGE_KEY_DEVICES = "drive_listing_devices_v1";
const ROOT_KEY = "drive_listing_state_v1";

/* optional local placeholder image (safe fallback for visual testing) */
const TEST_IMAGE_URL = "/mnt/data/283211d6-0565-4a6e-8cb0-3ba75474cb23.png";

/** small size guard for storing images in localStorage (data URL).
 *  If file is larger than this, user is asked to choose smaller file.
 *  Adjust as you prefer (300*1024 = 300KB).
 */
const IMAGE_SIZE_LIMIT_BYTES = 300 * 1024; // 300 KB

export type DeviceState = {
  id: string;
  deviceType: string;
  serial?: string;
  image?: string | null;
  own?: boolean;
};

interface Props {
  onNavigate?: (target: "subscription" | "device" | "easy-access") => void;
}

/* Default device slots */
const DEFAULT_SLOTS: DeviceState[] = [
  { id: "d1", deviceType: "Primary GPS", serial: "", image: null, own: false },
  { id: "d2", deviceType: "Secondary GPS", serial: "", image: null, own: false },
  { id: "d3", deviceType: "Drive mate Go", serial: "", image: null, own: false },
  { id: "d4", deviceType: "Lockbox", serial: "", image: null, own: false },
];

/* Safe JSON parse helper */
function safeParse<T = any>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/* Load persisted device list from device key; map onto DEFAULT_SLOTS for stable ordering */
function loadDevices(): DeviceState[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEVICES);
    if (!raw) return DEFAULT_SLOTS;
    const parsed = safeParse<any>(raw);
    if (!Array.isArray(parsed)) return DEFAULT_SLOTS;

    return DEFAULT_SLOTS.map((slot, idx) => {
      const p = parsed[idx] ?? parsed.find((x: any) => String(x?.id) === slot.id) ?? {};
      return {
        id: String(p.id ?? slot.id),
        deviceType: String(p.deviceType ?? slot.deviceType),
        serial: typeof p.serial === "string" ? p.serial : "",
        image: p.image ?? null,
        own: !!p.own,
      } as DeviceState;
    });
  } catch {
    return DEFAULT_SLOTS;
  }
}

/* Save to device-specific key */
function saveDevices(devs: DeviceState[]) {
  try {
    localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(devs));
  } catch (e) {
    // keep silent but log during dev
    // console.warn("saveDevices failed", e);
  }
}

/**
 * Merge devices into the application root payload (drive_listing_state_v1).
 * If markCompleted is true, ensure "Device" appears in completedSteps.
 *
 * This function merges non-destructively: it keeps existing root properties
 * and writes/overwrites `devices` + `completedSteps` + `timestamp`.
 */
function mergeDevicesIntoRoot(devs: DeviceState[], markCompleted = false) {
  try {
    const rawRoot = localStorage.getItem(ROOT_KEY);
    const root = safeParse<any>(rawRoot) || {};

    const existingCompleted: string[] =
      (Array.isArray(root.completedSteps) && root.completedSteps) ||
      (Array.isArray(root.subscription?.completedSteps) && root.subscription.completedSteps) ||
      [];

    const nextCompleted = markCompleted
      ? Array.from(new Set([...existingCompleted, "Device"]))
      : existingCompleted;

    const nextRoot = {
      ...root,
      devices: devs,
      completedSteps: nextCompleted,
      timestamp: Date.now(),
    };

    localStorage.setItem(ROOT_KEY, JSON.stringify(nextRoot));
  } catch (e) {
    // console.warn("mergeDevicesIntoRoot failed", e);
  }
}

const DevicePage: React.FC<Props> = ({ onNavigate }) => {
  const [devices, setDevices] = useState<DeviceState[]>(() => loadDevices());
  const [liveMessage, setLiveMessage] = useState<string>("");

  // persist devices to device key AND keep root in-sync (non-destructive)
  useEffect(() => {
    saveDevices(devices);
    mergeDevicesIntoRoot(devices, false);
  }, [devices]);

  const updateDevice = useCallback((id: string, patch: Partial<DeviceState>) => {
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }, []);

  const handleToggleOwn = useCallback((id: string) => {
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, own: !d.own } : d)));
  }, []);

  const handleDeviceTypeChange = useCallback((id: string, value: string) => {
    updateDevice(id, { deviceType: value });
  }, [updateDevice]);

  const handleSerialChange = useCallback((id: string, value: string) => {
    updateDevice(id, { serial: value });
  }, [updateDevice]);

  const handleFileSelect = useCallback((id: string, file?: File) => {
    if (!file) return;

    if (file.size > IMAGE_SIZE_LIMIT_BYTES) {
      window.alert(`Image too large. Please choose an image smaller than ${Math.round(IMAGE_SIZE_LIMIT_BYTES / 1024)} KB.`);
      setLiveMessage("Image rejected: file too large.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      updateDevice(id, { image: dataUrl });
      setLiveMessage("Image uploaded.");
    };
    reader.onerror = () => {
      // handle read errors gracefully
      window.alert("Failed to read the file. Please try another image.");
      setLiveMessage("Image upload failed.");
    };
    reader.readAsDataURL(file);
  }, [updateDevice]);

  const handleClearImage = useCallback((id: string) => {
    updateDevice(id, { image: null });
    setLiveMessage("Image removed.");
  }, [updateDevice]);

  const handleNext = useCallback(() => {
    // persist devices + merge into root and mark Device step completed
    saveDevices(devices);
    mergeDevicesIntoRoot(devices, true);

    if (typeof onNavigate === "function") {
      onNavigate("easy-access");
    } else {
      // If parent navigation not provided, you may integrate router navigate here
      // leaving intentionally blank to preserve your existing flow.
    }
  }, [devices, onNavigate]);

  return (
    <section className="subscription-wrap device-wrap" aria-labelledby="device-heading">
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
        <MobileDropdown value="Device" onOpen={() => {}} />

        <div className="card page-card" role="region" aria-labelledby="device-heading">
          <div className="devices-inner">
            <div className="devices-inner-body">
              <h2 id="device-heading" className="section-heading">Device management</h2>
              <p className="sub-note">
                Add details of the device, if any already installed on your car. If none, then continue to next step.
              </p>
            </div>

            <hr className="section-divider-inside" />

            <div className="devices-list">
              {devices.map((d, idx) => {
                const isLockbox = String(d.deviceType ?? "").toLowerCase().includes("lockbox");
                const open = isLockbox || !!d.own;

                return (
                  <div
                    key={d.id}
                    className={`device-entry ${open ? "extra-open" : ""}`}
                    aria-labelledby={`device-${d.id}-heading`}
                  >
                    <div className="device-row">
                      <div className="device-left">
                        <h3 id={`device-${d.id}-heading`} className="small-heading">Device {idx + 1}</h3>

                        <div className="field-row">
                          <label htmlFor={`deviceType-${d.id}`} className="field-label">Device type</label>
                          <input
                            id={`deviceType-${d.id}`}
                            name={`deviceType-${d.id}`}
                            className="device-type-input"
                            value={d.deviceType}
                            onChange={(e) => handleDeviceTypeChange(d.id, e.target.value)}
                            aria-label={`Device ${idx + 1} type`}
                          />
                        </div>
                      </div>

                      <div className="device-right">
                        {!isLockbox ? (
                          <div className="own-wrapper" role="group" aria-label={`Bringing device controls for ${d.deviceType}`}>
                            <div className="own-text">
                              <div className="own-title">Bringing your own device?</div>
                              <div className="own-desc">
                                Toggle this on if you're bringing your own device. Leave it off if Drive mate is to provide the device.
                              </div>
                            </div>

                            <div className="own-toggle-control">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={!!d.own}
                                aria-labelledby={`device-${d.id}-heading`}
                                onClick={() => handleToggleOwn(d.id)}
                                onKeyDown={(e) => {
                                  if (e.key === " " || e.key === "Enter") {
                                    e.preventDefault();
                                    handleToggleOwn(d.id);
                                  }
                                }}
                                className={`toggle-switch ${d.own ? "on" : "off"}`}
                                id={`own-toggle-${d.id}`}
                                tabIndex={0}
                                title={d.own ? "On" : "Off"}
                              >
                                <span className="toggle-knob" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="own-wrapper lockbox-empty" aria-hidden="true" />
                        )}
                      </div>
                    </div>

                    <div className={`device-extra ${open ? "open" : ""}`} aria-hidden={!open}>
                      <div className="device-extra-inner">
                        <div className="device-extra-left">
                          <label className="field-label">Serial number</label>
                          <input
                            className="device-serial-input"
                            value={d.serial ?? ""}
                            onChange={(e) => handleSerialChange(d.id, e.target.value)}
                            placeholder="Enter the serial number of the device"
                            aria-label={`Device ${idx + 1} serial`}
                          />
                        </div>

                        <div className="device-extra-right">
                          <label className="field-label">Upload an image of the device</label>

                          <div className="upload-box-wrap">
                            <label htmlFor={`upload-${d.id}`} className="upload-box" tabIndex={0} aria-hidden={false}>
                              {d.image ? (
                                <img src={d.image} alt={`device-${d.id}-preview`} loading="lazy" />
                              ) : (
                                <span className="upload-cta">Click to upload</span>
                              )}
                            </label>

                            <input
                              id={`upload-${d.id}`}
                              type="file"
                              accept="image/*"
                              className="upload-input"
                              onChange={(ev) => {
                                const f = ev.target.files && ev.target.files[0];
                                handleFileSelect(d.id, f ?? undefined);
                              }}
                              aria-label={`Upload image for device ${idx + 1}`}
                            />

                            {d.image ? (
                              <div className="upload-actions">
                                <button type="button" className="btn" onClick={() => handleClearImage(d.id)}>Clear</button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="desktop-cta" role="region" aria-label="Next action (desktop)">
          <button className="btn next-btn-desktop" type="button" onClick={handleNext} aria-label="Next">Next</button>
        </div>

        <div className="bottom-cta-mobile" aria-hidden={false}>
          <button className="btn desktop-hidden next-btn-mobile" type="button" onClick={handleNext} aria-label="Next">Next</button>
        </div>

        {/* aria-live for screen reader announcements (uploads/clears/errors) */}
        <div className="visually-hidden" aria-live="polite">{liveMessage}</div>
      </div>
    </section>
  );
};

export default DevicePage;
