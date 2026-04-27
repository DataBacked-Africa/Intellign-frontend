"use client";

import React from "react";
import SmartUploadWizard from "./SmartUploadWizard";

const UploadArea: React.FC = () => {
    return (
        <div className="w-full h-full flex flex-col" style={{ minHeight: '520px' }}>
            <SmartUploadWizard />
        </div>
    );
};

export default UploadArea;
