'use client';

import React, { useState } from "react";
import CreatableSelect from "react-select/creatable";

const techOptions = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue.js" },
  { value: "angular", label: "Angular" },
  { value: "nextjs", label: "Next.js" },
  { value: "python", label: "Python" }
];

export default function LimitedTags() {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const MAX_TAGS = 3; // O teu limite aqui

  const handleChange = (newValue) => {
    setSelectedOptions(newValue);
  };

  // --- A MÁGICA PARA CONVERTER EM LISTA SIMPLES ---
  // Transforma [{value: 'react', label: 'React'}] em ['react']
  const simpleList = selectedOptions.map(opt => opt.value);

  return (
    <div style={{ padding: "40px", maxWidth: "500px", fontFamily: "sans-serif" }}>
      <label style={{ fontWeight: "bold" }}>
        Escolha até {MAX_TAGS} tecnologias:
      </label>
      
      <div style={{ marginTop: "10px" }}>
        <CreatableSelect
          isMulti
          options={techOptions}
          value={selectedOptions}
          onChange={handleChange}
          // Desativa novas seleções se atingir o limite
          isOptionDisabled={() => selectedOptions.length >= MAX_TAGS}
          placeholder={
            selectedOptions.length >= MAX_TAGS 
              ? "Limite atingido!" 
              : "Selecione..."
          }
          formatCreateLabel={(inputValue) => `Criar "${inputValue}"`}
        />
      </div>

      <div style={{ marginTop: "30px", padding: "15px", background: "#f8f9fa", borderRadius: "8px" }}>
        <strong>Output (Lista Simples para a API):</strong>
        <code style={{ display: "block", marginTop: "10px", color: "#d63384" }}>
          {JSON.stringify(simpleList)}
        </code>
      </div>

      <button 
        onClick={() => console.log("Enviar para o servidor:", simpleList)}
        style={{ marginTop: "15px", padding: "8px 16px", cursor: "pointer" }}
      >
        Simular Envio
      </button>
    </div>
  );
}
