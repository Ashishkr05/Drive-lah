import React from "react";

interface Props {
  index: number;
  data?: {
    id?: string;
    type?: string;
    serial?: string;
    bringingOwn?: boolean;
    imageData?: string;
  };
  onChange: (index: number, patch: Partial<any>) => void;
  onRemove?: (index: number) => void;
}

const DeviceCard: React.FC<Props> = ({ index, data, onChange, onRemove }) => {
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange(index, { imageData: reader.result as string });
    };
    reader.readAsDataURL(f);
  }

  return (
    <div className="device-card" role="group" aria-label={`Device ${index + 1}`}>
      <h4>Device {index + 1}</h4>

      <label>Device type</label>
      <select value={data?.type || "Primary GPS"} onChange={(e) => onChange(index, { type: e.target.value })}>
        <option>Primary GPS</option>
        <option>Secondary GPS</option>
      </select>

      <label>Serial number</label>
      <input
        value={data?.serial || ""}
        placeholder="Enter serial number"
        onChange={(e) => onChange(index, { serial: e.target.value })}
      />

      <label style={{ marginTop: 10 }}>
        <input type="checkbox" checked={!!data?.bringingOwn} onChange={() => onChange(index, { bringingOwn: !data?.bringingOwn })} />
        Bringing your own device?
      </label>

      <div style={{ marginTop: 10 }}>
        <div style={{ marginBottom: 6 }}>Upload an image</div>
        <input type="file" accept="image/*" ref={fileRef} onChange={handleFile} />
        {data?.imageData && <img src={data.imageData} alt={`device-${index}`} style={{ marginTop: 8, maxWidth: "100%", borderRadius: 6 }} />}
      </div>

      {onRemove && (
        <div style={{ marginTop: 8 }}>
          <button onClick={() => onRemove(index)}>Remove</button>
        </div>
      )}
    </div>
  );
};

export default DeviceCard;
