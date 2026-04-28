import { Button } from '#/components/ui/button'
import { TAG_CATEGORIES } from '#/lib/tts-types'

interface TagToolbarProps {
  onInsert: (tag: string) => void
}

export function TagToolbar({ onInsert }: TagToolbarProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {TAG_CATEGORIES.map((category) => (
        <div key={category.name} className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">{category.icon}</span>
          {category.tags.map((tag) => (
            <Button
              key={tag}
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onInsert(`(${tag})`)}
            >
              {tag}
            </Button>
          ))}
        </div>
      ))}
    </div>
  )
}
