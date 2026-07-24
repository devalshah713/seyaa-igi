import { ExcelUpload } from "@/components/admin-actions";

export default function AdminUpload() {
  return (
    <div className="content">
      <div className="page-title">
        <h2>Upload Stock</h2>
        <p>Import your inventory Excel — map columns once, validate, then publish.</p>
      </div>
      <ExcelUpload />
    </div>
  );
}
