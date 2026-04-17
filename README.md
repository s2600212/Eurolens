# Project description

Eurolens is a web-based application designed to provide users with insights and analysis on European market trends. It leverages modern web technologies and AI tools to deliver a seamless and interactive user experience.

## Problem definition

Understanding and analyzing European market trends can be challenging due to the vast amount of data available. Eurolens aims to simplify this process by aggregating, analyzing, and presenting data in a user-friendly format, enabling users to make informed decisions.

The problem arose to us in our Economics class in Germany, when we needed to write papers for the module assessment. 

# Architecture Overview

The application follows a modular architecture with a clear separation of concerns. The frontend is built using React for dynamic user interfaces, while the backend is powered by Node.js and Express for handling API requests. Data is stored in a MongoDB database, and AI models are integrated for data analysis.

# Technology choices and justification

- **React**: Chosen for its component-based architecture and efficient rendering. Shadcn was used as the component library
- **Node.js and Express**: Selected for their lightweight and scalable backend capabilities.
- **Vite**: For easy development and deployment.
- **AI Tools**: Integrated to provide advanced data analysis, insights and Chatbot capabilities. (Google Gemini)

# AI Usage disclosure
AI Tools were used to generate and modify code. They were used in the ideation phase for different versions and than one of those versions was modified and adjusted.

All architecture and feature choices were made by us. AI was only used as a coding agent, while we did the requirements engineering part.


## Tools used

- Claude/Anthropic Models via API
- Gemini as ChatBot in the App
- During ideation phase: Cursor, Figma Make, Base44

## What was generated

- Different code snippets

## What was manually modified

- Customization of the AI-generated code to meet specific project requirements.
- Manual styling and UI adjustments for a better user experience.
- Requirements Engineering optimized prompting changing the AI-generated code

# Reflection and further improvements

While the project successfully meets its objectives, there is room for improvement:
- Optimize the application for better performance on small-screen devices.
- Add more data sources to provide a comprehensive analysis.
- Implement additional features based on user feedback.
- Improve documentation for easier onboarding of new developers.
- Advanced linking between pages
- Single country overview dashboard