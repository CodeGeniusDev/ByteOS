import { useMemo, useState } from "react";
import { Edit3, Pin, PinOff, Plus, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Conversation } from "@/types/chat";
import { cn } from "@/lib/utils";

type ConversationSidebarProps = {
  activeConversationId: string;
  conversations: Conversation[];
  onCreateConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
  onRenameConversation: (conversationId: string, title: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onTogglePin: (conversationId: string) => void;
};

export function ConversationSidebar({
  activeConversationId,
  conversations,
  onCreateConversation,
  onDeleteConversation,
  onRenameConversation,
  onSelectConversation,
  onTogglePin,
}: ConversationSidebarProps) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return conversations;
    }

    return conversations.filter((conversation) =>
      conversation.title.toLowerCase().includes(normalizedQuery),
    );
  }, [conversations, query]);

  function beginRename(conversation: Conversation) {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  }

  function commitRename(conversationId: string) {
    onRenameConversation(conversationId, editingTitle);
    setEditingId(null);
    setEditingTitle("");
  }

  return (
    <Card className="min-h-0 xl:min-h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Conversations</CardTitle>
            <CardDescription>Local chat history for this session.</CardDescription>
          </div>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={onCreateConversation}
            aria-label="New chat"
          >
            <Plus />
          </Button>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
            placeholder="Search chats"
            aria-label="Search conversations"
          />
        </div>
      </CardHeader>

      <CardContent className="min-h-0">
        <ScrollArea className="max-h-[22rem] xl:max-h-[calc(100vh-22rem)]">
          <div className="grid gap-2 pr-2">
            {filteredConversations.length === 0 ? (
              <div className="rounded-2xl border border-border bg-muted/55 p-4 text-sm text-muted-foreground">
                No conversations match your search.
              </div>
            ) : null}

            {filteredConversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              const isEditing = conversation.id === editingId;

              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "rounded-2xl border border-border bg-muted/55 p-3 transition-colors",
                    isActive && "border-primary/35 bg-primary/12",
                  )}
                >
                  {isEditing ? (
                    <form
                      className="grid gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        commitRename(conversation.id);
                      }}
                    >
                      <Input
                        value={editingTitle}
                        onChange={(event) => setEditingTitle(event.target.value)}
                        aria-label="Conversation title"
                      />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => onSelectConversation(conversation.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="line-clamp-2 font-medium">{conversation.title}</p>
                          {conversation.pinned ? <Badge>Pin</Badge> : null}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {conversation.messages.length} messages
                        </p>
                      </button>
                      <div className="mt-3 flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => onTogglePin(conversation.id)}
                          aria-label={conversation.pinned ? "Unpin conversation" : "Pin conversation"}
                        >
                          {conversation.pinned ? <PinOff /> : <Pin />}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => beginRename(conversation)}
                          aria-label="Rename conversation"
                        >
                          <Edit3 />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="ml-auto size-8"
                          onClick={() => onDeleteConversation(conversation.id)}
                          aria-label="Delete conversation"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
