// src/components/DeviceCard.tsx
import React from "react";

interface Props {
  id: string;
  deviceType: string;
  serialNumber?: string;
  imageUrl?: string;
  onSelectImage?: (id: string, file?: File) => void;
  onToggleOwn?: (id: string) => void;
  ownDevice?: boolean;
}

const DeviceCard: React.FC<Props> = ({ id, deviceType, serialNumber, imageUrl, onSelectImage, onToggleOwn, ownDevice }) => {
  return (
    <div className="device-card">
      <div className="device-row">
        <label className="device-label">Device type</label>
        <div className="device-type">{deviceType}</div>
      </div>

      <div className="device-row">
        <label className="device-label">Serial number</label>
        <input className="serial-input" placeholder="Enter the serial number of the device" defaultValue={serialNumber} />
      </div>

      <div className="device-row">
        <label className="device-label">Bringing your own device?</label>
        <label className="switch">
          <input type="checkbox" checked={!!ownDevice} onChange={() => onToggleOwn?.(id)} />
          <span className="slider" />
        </label>
      </div>

      <div className="device-row">
        <label className="device-label">Upload image</label>
        <label className="upload-box">
          {imageUrl ? (
            <img src={imageUrl} alt="device" className="device-preview" />
          ) : (
            <div className="upload-placeholder">Click to upload</div>
          )}
          <input type="file" accept="image/*" onChange={(e) => onSelectImage?.(id, e.target.files?.[0])} />
        </label>
      </div>
    </div>
  );
};

export default DeviceCard;
