"use client";

import { useState } from "react";
import Sidebar from "@/components/email/Sidebar";
import EmailHeader from "@/components/email/EmailHeader";

import ContactsView from "@/components/email/views/ContactsView";
import ListBuilderView from "@/components/email/views/ListBuilderView";
import ComposerView from "@/components/email/views/ComposerView";
import AccountsView from "@/components/email/views/AccountsView";
import AnalyticsView from "@/components/email/views/AnalyticsView";
import WarmupsView from "@/components/email/views/WarmupsView";
import ContextPanel from "@/components/email/views/ContextPanel";

export default function EmailPanel() {
  const [activeTab, setActiveTab] = useState<
    "contacts" | "builder" | "composer" | "accounts" | "analytics" | "warmups"
  >("contacts");
  const [selectedList, setSelectedList] = useState("All Contacts");

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
      {/* Left Sidebar */}
      <Sidebar
        selectedList={selectedList}
        onListSelect={setSelectedList}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <EmailHeader
          title={selectedList}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="flex-1 overflow-auto p-8 bg-[#0a0a0a]">
          {activeTab === "contacts" && (
            <ContactsView selectedList={selectedList} />
          )}
          {activeTab === "builder" && <ListBuilderView />}
          {activeTab === "composer" && <ComposerView />}
          {activeTab === "accounts" && <AccountsView />}
          {activeTab === "analytics" && <AnalyticsView />}
          {activeTab === "warmups" && <WarmupsView />}
        </div>
      </div>

      {/* Right Context Panel */}
      <div className="w-80 border-l border-zinc-900 bg-[#0a0a0a] p-6 hidden xl:block overflow-auto">
        <ContextPanel activeTab={activeTab} selectedList={selectedList} />
      </div>
    </div>
  );
}
