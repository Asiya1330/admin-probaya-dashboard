"use client";

import { useState, type JSX } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AiScoreSuggestion } from "@/types/admin.types";

type AiScoreSuggestionCardProps = {
  ingredientName: string;
  suggestion: AiScoreSuggestion;
  onApprove: () => void;
  onReject: () => void;
  onEdit: (edited: AiScoreSuggestion) => void;
};

export const AiScoreSuggestionCard = ({
  ingredientName,
  suggestion,
  onApprove,
  onReject,
  onEdit,
}: AiScoreSuggestionCardProps): JSX.Element => {
  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState(suggestion);

  return (
    <div className="rounded-xl border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 p-6">
      <h4 className="text-lg font-semibold text-white">
        AI Suggestion for {ingredientName}
      </h4>
      {!isEditing ? (
        <div className="mt-4 space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Impact Score:</span>{" "}
            <span className="font-medium text-white">{suggestion.impact_score}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Confidence:</span>{" "}
            <span className="badge-purple rounded-full border px-2 py-0.5 text-xs capitalize">
              {suggestion.confidence}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Classification:</span>{" "}
            {suggestion.classification}
          </p>
          <p className="text-muted-foreground">{suggestion.reasoning}</p>
          <p className="text-white">{suggestion.plain_english_summary}</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="space-y-2">
            <Label>Impact Score</Label>
            <Select
              value={String(edited.impact_score)}
              onValueChange={(v): void =>
                setEdited({ ...edited, impact_score: Number(v) as AiScoreSuggestion["impact_score"] })
              }
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["-2", "-1", "0", "1", "2"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Classification</Label>
            <Input
              value={edited.classification}
              onChange={(e): void =>
                setEdited({ ...edited, classification: e.target.value })
              }
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label>Summary</Label>
            <Input
              value={edited.plain_english_summary}
              onChange={(e): void =>
                setEdited({ ...edited, plain_english_summary: e.target.value })
              }
              className="bg-background"
            />
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {!isEditing ? (
          <>
            <Button className="btn-success border-0" onClick={onApprove}>
              Approve
            </Button>
            <Button variant="outline" onClick={(): void => setIsEditing(true)}>
              Edit
            </Button>
            <Button variant="destructive" onClick={onReject}>
              Reject
            </Button>
          </>
        ) : (
          <>
            <Button
              className="btn-success border-0"
              onClick={(): void => {
                onEdit(edited);
                setIsEditing(false);
              }}
            >
              Save & Approve
            </Button>
            <Button variant="outline" onClick={(): void => setIsEditing(false)}>
              Cancel Edit
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
