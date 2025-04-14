"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";

interface ClubCardProps {
  name: string;
  logo: string;
  division: string;
  ranking: number;
  balance: number;
  sponsorship: number;
  bids: number;
}

export function ClubCard({
  name,
  logo,
  division,
  ranking,
  balance,
  sponsorship,
  bids,
}: ClubCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/20 to-transparent" />

      <div className="relative p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12">
              <Image
                src={logo}
                alt={name}
                fill
                className="rounded-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{division}</p>
              <h2 className="font-semibold">{name}</h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">RANKING</p>
            <p className="text-2xl font-bold">{ranking}º</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">ORÇAMENTO</p>
            <p className="text-xl font-bold">{formatCurrency(balance)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">SALÁRIO</p>
              <p className="font-semibold">{formatCurrency(sponsorship)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">SALDO DISPONÍVEL</p>
              <p className="font-semibold">{formatCurrency(bids)}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
