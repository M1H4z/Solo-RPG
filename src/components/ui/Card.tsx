import * as React from "react"
import { cn } from "@/lib/utils"

// --- Card Root Container --- 
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-border-dark bg-surface text-text-primary shadow-lg", // Base card style using theme colors
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

// --- Card Header --- 
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4 sm:p-6", className)} // Standard padding
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

// --- Card Title --- 
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    // Adjusted styling for better fit within card
    className={cn("text-xl sm:text-2xl font-semibold leading-none tracking-tight text-text-primary", className)} 
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

// --- Card Description --- 
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-text-secondary", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

// --- Card Content --- 
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 sm:p-6 pt-0", className)} {...props} /> // Padding, top padding removed to flow from header
))
CardContent.displayName = "CardContent"

// --- Card Footer --- 
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 sm:p-6 pt-0", className)} // Padding, top padding removed
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } 