'use client'
import React from 'react'
import { Chapter } from '@/lib/models'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Check } from 'lucide-react'

function ChapterItem({ chapter }: { chapter: Chapter }) {
  return (
    <Card className='gap-2 hover:bg-black/10 transition-colors duration-100 cursor-pointer'>
      <CardHeader className='flex items-center'>
        <h2 className='text-lg font-semibold'>{chapter.chapter_number}. {chapter.title}</h2>
        {chapter.completed && <Check className='h-6 w-6' color='green' strokeWidth={2}/>}
      </CardHeader>
      <CardContent>
        <p className='text-muted-foreground'>{chapter.description}</p>
      </CardContent>
    </Card>
  )
}

export default ChapterItem