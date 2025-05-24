// src/components/action-history/ActionHistoryClient.tsx
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useActionHistory } from '@/contexts/ActionHistoryContext';
import type { ActionRecord } from '@/types';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History } from 'lucide-react';

const getStatusBadgeVariant = (status: ActionRecord['status']): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'Executed (Simulated)':
      return 'default';
    case 'Approved':
      return 'default'; // Using 'default' for positive states
    case 'Pending Approval':
      return 'outline';
    case 'Failed (Simulated)':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export function ActionHistoryClient() {
  const { actionHistory } = useActionHistory();

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          Action History
        </CardTitle>
        <CardDescription>
          A comprehensive log of all administrative actions performed or suggested within the system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[600px] w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="w-[150px]">Performed By</TableHead>
                <TableHead className="w-[180px]">Status</TableHead>
                <TableHead className="text-right hidden md:table-cell">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actionHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No actions recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                actionHistory.map((action) => (
                  <TableRow key={action.id}>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(action.timestamp), "yyyy-MM-dd HH:mm:ss")}
                    </TableCell>
                    <TableCell className="font-medium">{action.action}</TableCell>
                    <TableCell>{action.user}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(action.status)} className="text-xs">
                        {action.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground hidden md:table-cell">{action.details || 'N/A'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
             <TableCaption className={actionHistory.length === 0 ? 'hidden' : ''}>
              End of action log. Actions are stored temporarily and will reset on page refresh.
            </TableCaption>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
