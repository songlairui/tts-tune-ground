import { Button } from '#/components/ui/button'

interface GenerateButtonProps {
  isLoading: boolean
  disabled: boolean
  onClick: () => void
  onCancel?: () => void
}

export function GenerateButton({
  isLoading,
  disabled,
  onClick,
  onCancel,
}: GenerateButtonProps) {
  if (isLoading) {
    return (
      <Button
        onClick={onCancel}
        variant="destructive"
        size="lg"
        className="w-full"
      >
        ⏹️ Cancel Generation
      </Button>
    )
  }

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      size="lg"
      className="w-full"
    >
      🎙️ Generate Audio
    </Button>
  )
}
