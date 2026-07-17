export default function Table({ columns, rows, getRowKey = (_, index) => index, emptyMessage = 'Không có dữ liệu' }) {
  return (
    <div className="neo-table-wrap">
      <table className="neo-table">
        <thead>
          <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length}>{emptyMessage}</td></tr>
          ) : rows.map((row, rowIndex) => (
            <tr key={getRowKey(row, rowIndex)}>
              {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
