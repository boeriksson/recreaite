/**
 * pages.config.js - Page routing configuration
 *
 * This file defines the pages and routing for the application.
 */
import Dashboard from './pages/Dashboard';
import Gallery from './pages/Gallery';
import Garments from './pages/Garments';
import Landing from './pages/Landing';
import ModelTraining from './pages/ModelTraining';
import Models from './pages/Models';
import SiteScanner from './pages/SiteScanner';
import Templates from './pages/Templates';
import Upload from './pages/Upload';
import UploadGarment from './pages/UploadGarment';
import VideoGenerator from './pages/VideoGenerator';
import __Layout from './Layout.jsx';

export const PAGES = {
    "Dashboard": Dashboard,
    "Gallery": Gallery,
    "Garments": Garments,
    "Landing": Landing,
    "ModelTraining": ModelTraining,
    "Models": Models,
    "SiteScanner": SiteScanner,
    "Templates": Templates,
    "Upload": Upload,
    "UploadGarment": UploadGarment,
    "VideoGenerator": VideoGenerator,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};
