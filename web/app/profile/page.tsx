"use client";

import { faIdBadge } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Breadcrumb from "../components/breadcrumb";
import ProfileContent from "./components/content";
import { requireCurrentUser } from "../services/auth";
import { apiMyEventList } from "../services/event";
import { useEffect, useState } from "react";

const Page: React.FC = () => {

  const [currentUser, setCurrentUser] = useState<API.CurrentUser | null>(null);
  const [events, setEvents] = useState<API.MyEventItem[]>([]);

  useEffect(() => {
    requireCurrentUser().then(user => {
      setCurrentUser(user);
    });
    apiMyEventList().then(response => {
      setEvents(response);
    });
  }, []);

  return (
    <main>
      <Breadcrumb title="Hồ sơ cá nhân" items={[
        { label: "Hồ sơ cá nhân", href: "/profile" }
      ]} />
      <div className="container mx-auto py-8 md:py-20 px-4 md:px-0">
        <div className="text-center mb-8">
          <div className="text-sm text-red-700 font-bold uppercase"><FontAwesomeIcon icon={faIdBadge} className="w-3 h-3 inline" /> My Profile</div>
          <div className="text-3xl md:text-4xl font-bold mt-2">Hồ sơ cá nhân</div>
        </div>
        {currentUser && <ProfileContent currentUser={currentUser} events={events} />}
      </div>
    </main>
  );
};

export default Page;