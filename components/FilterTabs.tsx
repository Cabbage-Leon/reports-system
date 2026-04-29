interface FilterTabsProps {
  activeType: string
  onTypeChange: (type: string) => void
}

const types = [
  { value: 'all', label: '全部' },
  { value: 'day', label: '日报' },
  { value: 'week', label: '周报' },
  { value: 'month', label: '月报' },
]

export default function FilterTabs({ activeType, onTypeChange }: FilterTabsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {types.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onTypeChange(value)}
          className={`badge transition-colors ${
            activeType === value
              ? 'bg-primary text-white'
              : 'bg-gray-100 hover:bg-primary/10'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
