"use client";

import React, { useState } from "react";
import { useCrewStore } from "@/store/crew";
import { RoleBadge } from "./RoleBadge";
import { CREW_ROLES, type CrewRole, type ResourceType } from "@/engine/crew/types";
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Send,
  PlusCircle,
  HelpCircle,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export const NegotiationPanel: React.FC = () => {
  const {
    myRole,
    proposals,
    resourceAsks,
    submitProposal,
    castVote,
    submitResourceAsk,
    respondToResourceAsk,
  } = useCrewStore();

  const [activeTab, setActiveTab] = useState<"proposals" | "asks">("proposals");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // New proposal form state
  const [showNewProposal, setShowNewProposal] = useState(false);
  const [propTitle, setPropTitle] = useState("");
  const [propDesc, setPropDesc] = useState("");

  // New resource ask form state
  const [showNewAsk, setShowNewAsk] = useState(false);
  const [askToRole, setAskToRole] = useState<CrewRole>("FLIGHT_DYNAMICS");
  const [askResource, setAskResource] = useState<ResourceType>("power");
  const [askDelta, setAskDelta] = useState("40");
  const [askRationale, setAskRationale] = useState("");

  const pendingProposalsCount = proposals.filter((p) => p.status === "pending").length;
  const openAsksCount = resourceAsks.filter((a) => a.status === "open").length;

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propTitle.trim()) return;
    submitProposal(propTitle.trim(), propDesc.trim(), {});
    setPropTitle("");
    setPropDesc("");
    setShowNewProposal(false);
  };

  const handleCreateAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!askRationale.trim()) return;
    submitResourceAsk(
      askToRole,
      askResource,
      parseFloat(askDelta) || 0,
      askRationale.trim()
    );
    setAskRationale("");
    setShowNewAsk(false);
  };

  return (
    <div className="bg-space-panel/95 border-t border-space-border flex flex-col font-mono text-xs text-slate-200">
      {/* Drawer Header Toggle */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-space-border/60 bg-black/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-telemetry-amber font-heading font-bold text-sm tracking-widest uppercase">
            <MessageSquare className="w-4 h-4" />
            <span>CREW NEGOTIATION COUNCIL</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("proposals")}
              className={`px-2.5 py-1 rounded text-[11px] font-heading uppercase transition-all flex items-center gap-1.5 ${
                activeTab === "proposals"
                  ? "bg-telemetry-amber/20 text-telemetry-amber border border-telemetry-amber/40"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <span>Proposals</span>
              {pendingProposalsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-telemetry-amber text-black font-bold text-[9px] flex items-center justify-center">
                  {pendingProposalsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("asks")}
              className={`px-2.5 py-1 rounded text-[11px] font-heading uppercase transition-all flex items-center gap-1.5 ${
                activeTab === "asks"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <span>Resource Asks</span>
              {openAsksCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-purple-500 text-white font-bold text-[9px] flex items-center justify-center">
                  {openAsksCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-400 hover:text-white p-1 rounded"
          title={isCollapsed ? "Expand Council" : "Collapse Council"}
        >
          {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Drawer Body (Collapsible) */}
      {!isCollapsed && (
        <div className="p-4 max-h-[320px] overflow-y-auto flex flex-col gap-3">
          {/* TAB 1: PROPOSALS & VOTES */}
          {activeTab === "proposals" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  Majority vote required to ratify cross-subsystem changes. Mission Director breaks ties.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewProposal(!showNewProposal)}
                  className="flex items-center gap-1 text-[11px]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Draft Proposal</span>
                </Button>
              </div>

              {/* Form to submit proposal */}
              {showNewProposal && (
                <form
                  onSubmit={handleCreateProposal}
                  className="p-3 rounded bg-black/50 border border-telemetry-amber/40 flex flex-col gap-2"
                >
                  <span className="font-heading uppercase text-xs font-bold text-telemetry-amber">
                    Draft Cross-Role Proposal
                  </span>
                  <input
                    type="text"
                    value={propTitle}
                    onChange={(e) => setPropTitle(e.target.value)}
                    placeholder="Proposal title (e.g. Upgrade to Triple-Junction Solar Array)"
                    className="w-full px-2.5 py-1.5 bg-black/60 border border-space-border rounded text-xs text-white focus:outline-none focus:border-telemetry-amber"
                    required
                  />
                  <textarea
                    value={propDesc}
                    onChange={(e) => setPropDesc(e.target.value)}
                    placeholder="Operational rationale and projected trade-offs..."
                    rows={2}
                    className="w-full px-2.5 py-1.5 bg-black/60 border border-space-border rounded text-xs text-white focus:outline-none focus:border-telemetry-amber"
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => setShowNewProposal(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit">
                      Table Proposal
                    </Button>
                  </div>
                </form>
              )}

              {/* List of active/resolved proposals */}
              {proposals.length === 0 ? (
                <div className="py-6 text-center text-gray-500 font-mono text-xs">
                  No active proposals on the floor. All subsystem decisions currently aligned.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {proposals.map((prop) => {
                    const myVote = prop.votes[myRole];
                    const yesVotes = Object.values(prop.votes).filter((v) => v === "yes").length;
                    const noVotes = Object.values(prop.votes).filter((v) => v === "no").length;
                    const isPending = prop.status === "pending";

                    return (
                      <div
                        key={prop.id}
                        className={`p-3 rounded border flex flex-col gap-2 transition-all ${
                          isPending
                            ? "bg-black/40 border-space-border"
                            : prop.status === "approved"
                            ? "bg-telemetry-green/5 border-telemetry-green/30"
                            : "bg-red-500/5 border-red-500/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <RoleBadge role={prop.proposerRole} size="sm" />
                              <span className="font-heading uppercase font-bold text-xs text-white">
                                {prop.title}
                              </span>
                            </div>
                            <span className="text-[11px] text-gray-400 mt-1">
                              {prop.description || "No trade study rationale provided."}
                            </span>
                          </div>

                          <Badge
                            variant={
                              prop.status === "approved"
                                ? "nominal"
                                : prop.status === "rejected"
                                ? "alert"
                                : "amber"
                            }
                            size="sm"
                          >
                            {prop.status.toUpperCase()}
                          </Badge>
                        </div>

                        {/* Votes breakdown bar */}
                        <div className="flex items-center justify-between text-[11px] border-t border-space-border/40 pt-2 text-gray-400">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-telemetry-green">
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{yesVotes} FOR</span>
                            </span>
                            <span className="flex items-center gap-1 text-red-400">
                              <ThumbsDown className="w-3.5 h-3.5" />
                              <span>{noVotes} AGAINST</span>
                            </span>
                            {prop.resolutionReason && (
                              <span className="text-[10px] text-gray-400 italic">
                                ({prop.resolutionReason})
                              </span>
                            )}
                          </div>

                          {/* Voting actions for local user if pending */}
                          {isPending && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => castVote(prop.id, "yes")}
                                className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                                  myVote === "yes"
                                    ? "bg-telemetry-green text-black border-telemetry-green"
                                    : "bg-black/40 text-telemetry-green border-telemetry-green/40 hover:bg-telemetry-green/20"
                                }`}
                              >
                                <ThumbsUp className="w-3 h-3" />
                                <span>Vote Yes</span>
                              </button>

                              <button
                                onClick={() => castVote(prop.id, "no")}
                                className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                                  myVote === "no"
                                    ? "bg-red-500 text-white border-red-500"
                                    : "bg-black/40 text-red-400 border-red-500/40 hover:bg-red-500/20"
                                }`}
                              >
                                <ThumbsDown className="w-3 h-3" />
                                <span>Vote No</span>
                              </button>

                              <button
                                onClick={() => castVote(prop.id, "abstain")}
                                className={`px-2 py-0.5 rounded border text-[10px] uppercase transition-all flex items-center gap-1 ${
                                  myVote === "abstain"
                                    ? "bg-gray-400 text-black border-gray-400"
                                    : "bg-black/40 text-gray-400 border-gray-600 hover:bg-white/10"
                                }`}
                              >
                                <Minus className="w-3 h-3" />
                                <span>Abstain</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RESOURCE ASKS */}
          {activeTab === "asks" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  Request margin allocations between roles (e.g. power budget, payload mass, delta-V).
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewAsk(!showNewAsk)}
                  className="flex items-center gap-1 text-[11px]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Request Resources</span>
                </Button>
              </div>

              {/* Form to submit resource ask */}
              {showNewAsk && (
                <form
                  onSubmit={handleCreateAsk}
                  className="p-3 rounded bg-black/50 border border-purple-500/40 flex flex-col gap-2"
                >
                  <span className="font-heading uppercase text-xs font-bold text-purple-400">
                    Submit Inter-Role Resource Request
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-0.5">Target Role</label>
                      <select
                        value={askToRole}
                        onChange={(e) => setAskToRole(e.target.value as CrewRole)}
                        className="w-full px-2 py-1 bg-black/60 border border-space-border rounded text-xs text-white"
                      >
                        {Object.values(CREW_ROLES).map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.shortTitle}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 block mb-0.5">Resource</label>
                      <select
                        value={askResource}
                        onChange={(e) => setAskResource(e.target.value as ResourceType)}
                        className="w-full px-2 py-1 bg-black/60 border border-space-border rounded text-xs text-white"
                      >
                        <option value="power">Power (Watts)</option>
                        <option value="mass">Mass (kg)</option>
                        <option value="budget">Budget ($M)</option>
                        <option value="deltav">Delta-V (m/s)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 block mb-0.5">Delta (+/-)</label>
                      <input
                        type="number"
                        value={askDelta}
                        onChange={(e) => setAskDelta(e.target.value)}
                        placeholder="e.g. +40"
                        className="w-full px-2 py-1 bg-black/60 border border-space-border rounded text-xs text-white"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={askRationale}
                    onChange={(e) => setAskRationale(e.target.value)}
                    placeholder="Rationale (e.g. Needed for second hyperspectral imager band)..."
                    className="w-full px-2.5 py-1.5 bg-black/60 border border-space-border rounded text-xs text-white focus:outline-none focus:border-purple-400"
                    required
                  />

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => setShowNewAsk(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit">
                      Send Request
                    </Button>
                  </div>
                </form>
              )}

              {/* List of resource asks */}
              {resourceAsks.length === 0 ? (
                <div className="py-6 text-center text-gray-500 font-mono text-xs">
                  No inter-role resource requests filed. All subsystem margins are operating within limits.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {resourceAsks.map((ask) => {
                    const isForMe = ask.toRole === myRole;
                    const isOpen = ask.status === "open";

                    return (
                      <div
                        key={ask.id}
                        className={`p-3 rounded border flex items-center justify-between gap-3 ${
                          isOpen
                            ? "bg-black/40 border-space-border"
                            : ask.status === "approved"
                            ? "bg-telemetry-green/5 border-telemetry-green/30"
                            : "bg-red-500/5 border-red-500/30"
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <RoleBadge role={ask.fromRole} size="sm" />
                            <span className="text-gray-400 text-[10px]">requested</span>
                            <span className="font-bold text-white font-mono">
                              {ask.deltaValue > 0 ? `+${ask.deltaValue}` : ask.deltaValue} {ask.unit}
                            </span>
                            <span className="text-gray-400 text-[10px]">from</span>
                            <RoleBadge role={ask.toRole} size="sm" />
                          </div>
                          <span className="text-[11px] text-gray-300">
                            &quot;{ask.rationale}&quot;
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isOpen && isForMe ? (
                            <>
                              <button
                                onClick={() => respondToResourceAsk(ask.id, true)}
                                className="px-2.5 py-1 rounded bg-telemetry-green/20 text-telemetry-green border border-telemetry-green/50 hover:bg-telemetry-green/30 text-[10px] font-bold uppercase transition-all flex items-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Grant</span>
                              </button>
                              <button
                                onClick={() => respondToResourceAsk(ask.id, false)}
                                className="px-2.5 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 text-[10px] font-bold uppercase transition-all flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Deny</span>
                              </button>
                            </>
                          ) : (
                            <Badge
                              variant={
                                ask.status === "approved"
                                  ? "nominal"
                                  : ask.status === "declined"
                                  ? "alert"
                                  : "neutral"
                              }
                              size="sm"
                            >
                              {ask.status.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
