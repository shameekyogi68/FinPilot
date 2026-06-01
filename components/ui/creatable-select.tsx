"use client"

import React, { useState, useRef, useEffect } from "react"
import { Input } from "./input"
import { ChevronDown } from "lucide-react"

type CreatableSelectProps = {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string; icon?: string }[]
  placeholder?: string
  id?: string
  className?: string
}

export function CreatableSelect({ value, onChange, options, placeholder, id, className }: CreatableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        // Commit the typed value when clicking outside
        onChange(inputValue)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [inputValue, onChange])

  const filteredOptions = options.filter(opt => 
    opt.value.toLowerCase().includes(inputValue.toLowerCase()) || 
    opt.label.toLowerCase().includes(inputValue.toLowerCase())
  )

  const handleSelect = (val: string) => {
    setInputValue(val)
    onChange(val)
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      onChange(inputValue)
      setIsOpen(false)
    }
    if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Input
          id={id}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none opacity-50" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-white/15 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            <div className="p-1">
              {filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[rgba(20,20,25,0.6)]/10 transition-colors flex items-center gap-2"
                >
                  {opt.icon && <span>{opt.icon}</span>}
                  <span className="capitalize">{opt.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 text-sm text-muted-foreground flex items-center justify-between">
              <span>Create "{inputValue}"</span>
              <span className="text-[10px] bg-[rgba(20,20,25,0.6)]/10 px-1.5 py-0.5 rounded">Enter</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
