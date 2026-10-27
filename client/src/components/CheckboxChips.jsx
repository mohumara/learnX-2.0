/** A row of toggleable chips bound to an array of selected values. */
export default function CheckboxChips({ options, value, onChange, idPrefix }) {
  const toggle = (option) =>
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);

  return (
    <div className="chip-checkboxes">
      {options.map((option, i) => (
        <div className="form-check chip-check" key={option}>
          <input
            className="form-check-input"
            type="checkbox"
            id={`${idPrefix}-${i}`}
            checked={value.includes(option)}
            onChange={() => toggle(option)}
          />
          <label className="form-check-label" htmlFor={`${idPrefix}-${i}`}>{option}</label>
        </div>
      ))}
    </div>
  );
}
