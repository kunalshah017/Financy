
./bin/ollama serve &

pid=$!

sleep 5

echo "Pulling models..."

ollama pull calebfahlgren/natural-functions

ollama pull llama3.2-vision

wait $pid