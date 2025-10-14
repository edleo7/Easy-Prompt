import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PromptGenerate from './pages/PromptGenerate';
import PromptDetail from './pages/PromptDetail';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<PromptGenerate />} />
            <Route path="/prompt-detail" element={<PromptDetail />} />
        </Routes>
    );
};

export default AppRoutes;