# modulo contiene istruzioni di gioco
# modulo incluso nella classe Game
module TextIstruzioni
  # HEREDOC e un modo per scrivere stringhe multiline
  def istruzioni
    <<~HEREDOC   

      PERUDO
      Ciao qui scrivo le istruzioni di gioco.

      Per ora scrivo il programma in ruby

      Magari lo convertiro in Javascript
      Magari le istruzioni e meglio scriverle in un file md invece che in un testo come qui?
      
    HEREDOC
  end
end

