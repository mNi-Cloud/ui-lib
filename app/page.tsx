import * as React from "react"
import { OpenInV0Button } from "@/components/open-in-v0-button"
// This page displays items from the custom registry.
// You are free to implement this with your own design as needed.

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col min-h-svh px-4 py-8 gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Custom Registry</h1>
        <p className="text-muted-foreground">
          A custom registry for distributing code using shadcn.
        </p>
      </header>
      <main className="flex flex-col flex-1 gap-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] relative">
          <h2 className="text-xl text-muted-foreground">カスタムレジストリコンポーネントがここに表示されます</h2>
        </div>


      </main>
    </div>
  )
}
