import React, { Children } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

function AlertConfirmation({ children, stopInterview }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger >
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>End the interview?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Your answers so far will be scored. You can&apos;t continue this interview after ending it.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Keep going</AlertDialogCancel>
                    <AlertDialogAction className="rounded-xl bg-red-500 text-white hover:bg-red-600" onClick={()=>stopInterview()}>End interview</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default AlertConfirmation