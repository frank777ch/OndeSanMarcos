export function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[75%] rounded-lg bg-primary px-4 py-3 whitespace-pre-wrap text-on-primary [overflow-wrap:anywhere]">
        {text}
      </p>
    </div>
  )
}
