import React from "react";
import { Icon } from "../dashboard/ui";
import { StepHeader, WizardNav } from "./parts";

export const ExcelStep: React.FC<{
  step: { index: number; total: number; name: string };
  fileName: string;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  success: string;
  error: string;
  onBack: () => void;
  onFinish: () => void;
  saving: boolean;
  saveMsg: string;
  saveError: string;
}> = ({ step, fileName, onFile, success, error, onBack, onFinish, saving, saveMsg, saveError }) => (
  <div className="d-page d-page--narrow">
    <StepHeader
      step={step}
      title="Upload your timetable"
      sub="Choose the Excel file with your masjid's prayer times. You will check which column is which before anything is saved."
    />

    <section className="d-card d-card-pad d-stack" style={{ gap: 18 }} aria-label="Timetable file">
      <input id="wz-file" type="file" accept=".xlsx,.xls" className="d-sr-only" onChange={e => { onFile(e); e.target.value = ""; }} />
      {success ? (
        <>
          <div role="status" className="d-notice d-notice--success">
            <Icon name="check_circle" />
            <div className="d-stack" style={{ gap: 2 }}>
              <span>Your timetable is saved.</span>
              <span style={{ fontWeight: 400 }}>{fileName}: {success}</span>
            </div>
          </div>
          <label htmlFor="wz-file" className="d-btn d-btn--secondary" style={{ alignSelf: "flex-start" }}>
            <Icon name="upload_file" />Upload a different file
          </label>
        </>
      ) : (
        <label htmlFor="wz-file" className="wz-drop">
          <span className="wz-feature-icon"><Icon name="upload_file" /></span>
          <span className="d-h3">Choose your Excel file</span>
          <span className="d-muted">An .xlsx or .xls file with a date column and a column for each prayer.</span>
          <span className="d-btn d-btn--primary" aria-hidden="true" style={{ marginTop: 6 }}>Choose a file</span>
        </label>
      )}
      {error && <p role="alert" className="d-notice d-notice--danger" style={{ margin: 0 }}><Icon name="error" />{error}</p>}
      <p className="d-help">No file to hand? You can finish now and upload it later on the Prayer times page.</p>
    </section>

    {saveError && <p role="alert" className="d-notice d-notice--danger" style={{ margin: 0 }}><Icon name="error" />{saveError}</p>}
    <WizardNav onBack={onBack} onNext={onFinish} nextLabel="Finish setup" busy={saving} busyLabel={saveMsg} />
  </div>
);
