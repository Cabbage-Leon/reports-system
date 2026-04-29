interface TopicTagsProps {
  topics: string[]
  activeTopic: string
  onTopicChange: (topic: string) => void
}

export default function TopicTags({ topics, activeTopic, onTopicChange }: TopicTagsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <button
        onClick={() => onTopicChange('all')}
        className={`badge transition-colors ${
          activeTopic === 'all'
            ? 'bg-primary text-white'
            : 'bg-gray-100 hover:bg-primary/10'
        }`}
      >
        全部标签
      </button>
      {topics.map((topic) => (
        <button
          key={topic}
          onClick={() => onTopicChange(topic)}
          className={`badge transition-colors ${
            activeTopic === topic
              ? 'bg-primary text-white'
              : 'bg-gray-100 hover:bg-primary/10'
          }`}
        >
          {topic}
        </button>
      ))}
    </div>
  )
}
