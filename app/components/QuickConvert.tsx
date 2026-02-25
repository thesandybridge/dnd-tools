'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { preventNonNumeric, handleFocus } from '@/app/tools/components/calculator/helper'
import Gold from '@/app/tools/components/calculator/currency_svgs/Gold'
import Silver from '@/app/tools/components/calculator/currency_svgs/Silver'
import Copper from '@/app/tools/components/calculator/currency_svgs/Copper'
import Platinum from '@/app/tools/components/calculator/currency_svgs/Platinum'
import Electrum from '@/app/tools/components/calculator/currency_svgs/Electrum'

const currencies = [
  { key: 'CP', label: 'Copper', rate: 1, icon: <Copper /> },
  { key: 'SP', label: 'Silver', rate: 10, icon: <Silver /> },
  { key: 'EP', label: 'Electrum', rate: 50, icon: <Electrum /> },
  { key: 'GP', label: 'Gold', rate: 100, icon: <Gold /> },
  { key: 'PP', label: 'Platinum', rate: 1000, icon: <Platinum /> },
]

export default function QuickConvert() {
  const [amount, setAmount] = useState(0)
  const [selected, setSelected] = useState('GP')

  const fromRate = currencies.find(c => c.key === selected)!.rate
  const conversions = currencies
    .filter(c => c.key !== selected)
    .map(c => ({
      ...c,
      converted: ((fromRate / c.rate) * amount).toFixed(2).replace(/\.?0+$/, ''),
    }))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          onFocus={handleFocus}
          onBlur={(e) => { if (e.target.value === '') setAmount(0) }}
          onKeyDown={preventNonNumeric}
          className="flex-1 bg-white/[0.05] border-white/[0.08]"
        />
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-24 sm:w-28 shrink-0 bg-white/[0.05] border-white/[0.08]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currencies.map(c => (
              <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2 min-w-0">
        {conversions.map(c => (
          <div key={c.key} className="flex items-center gap-1.5 rounded-md bg-white/[0.03] border border-white/[0.06] px-2 py-1.5 min-w-0">
            {c.icon}
            <span className="text-sm font-medium truncate">{Number(c.converted).toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">{c.key}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
